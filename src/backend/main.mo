import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // =========================
  // ======= TYPES ===========
  // =========================

  type UserId = Principal;
  type CategoryId = Nat;
  type DocumentId = Nat;

  public type UserProfile = {
    username : Text;
    role : Text;
    createdAt : Time.Time;
  };

  type Credentials = {
    username : Text;
    passwordHash : Text;
    createdAt : Time.Time;
  };

  module Category {
    public type Category = {
      id : Nat;
      name : Text;
      description : ?Text;
      createdAt : Time.Time;
      color : ?Text;
    };

    public func compareByTimestamp(a : Category, b : Category) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Document {
    public type Document = {
      id : DocumentId;
      title : Text;
      fileName : Text;
      fileSize : Nat;
      mimeType : Text;
      categoryId : CategoryId;
      createdAt : Time.Time;
      blob : ?Storage.ExternalBlob;
    };

    public func compareByTimestamp(a : Document, b : Document) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // =========================
  // ======= STATE ===========
  // =========================

  type State = {
    categories : Map.Map<CategoryId, Category.Category>;
    documents : Map.Map<DocumentId, Document.Document>;
    var currentDocumentId : Nat;
    var currentCategoryId : Nat;
  };

  let persistentState = Map.empty<UserId, State>();
  let userProfiles = Map.empty<UserId, UserProfile>();
  // username -> Credentials (for password validation)
  let credentialsStore = Map.empty<Text, Credentials>();
  // username -> Principal (for username->principal lookup)
  let usernameIndex = Map.empty<Text, Principal>();

  // Admin secret code — only users who provide this during registration get the admin role.
  // Admins can update this code at any time.
  var adminSecretCode : Text = "INFINEXY_ADMIN_2024";

  // Default categories created for every new user
  let DEFAULT_CATEGORIES : [(Text, Text)] = [
    ("Aadhar Card", "#3B82F6"),
    ("Pan Card", "#F59E0B"),
    ("Passport", "#22C55E"),
    ("Voter ID", "#EF4444"),
    ("Driving Licence", "#A855F7"),
    ("Insurance", "#EC4899"),
    ("Bank Statement", "#06B6D4"),
    ("Education Certificate", "#84CC16"),
  ];

  func getUserState(id : UserId) : State {
    switch (persistentState.get(id)) {
      case (null) {
        let newState : State = {
          categories = Map.empty<CategoryId, Category.Category>();
          documents = Map.empty<DocumentId, Document.Document>();
          var currentDocumentId = 0;
          var currentCategoryId = 0;
        };
        persistentState.add(id, newState);
        newState;
      };
      case (?state) { state };
    };
  };

  // =========================
  // ======= MIXINS ==========
  // =========================

  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ============================
  // Username/Password Auth
  // ============================

  /// Register a new user with username and password hash.
  /// Optionally provide an adminCode — if it matches the stored secret, the user gets the admin role.
  public shared ({ caller }) func register(username : Text, passwordHash : Text, adminCode : ?Text) : async { #ok; #err : Text } {
    // Validate username not empty
    if (username.size() == 0) {
      return #err("Username cannot be empty");
    };
    // Check username not already taken
    switch (usernameIndex.get(username)) {
      case (?_) { return #err("Username already taken") };
      case (null) {};
    };
    // Check caller principal not already registered
    switch (userProfiles.get(caller)) {
      case (?_) { return #err("This device identity is already registered") };
      case (null) {};
    };

    // Determine role based on admin code
    let isAdmin = switch (adminCode) {
      case (?code) { code == adminSecretCode };
      case (null) { false };
    };
    let role = if (isAdmin) { "admin" } else { "user" };
    let roleValue : AccessControl.UserRole = if (isAdmin) { #admin } else { #user };

    // Store credentials
    let creds : Credentials = {
      username = username;
      passwordHash = passwordHash;
      createdAt = Time.now();
    };
    credentialsStore.add(username, creds);
    usernameIndex.add(username, caller);

    // Store profile
    let profile : UserProfile = {
      username = username;
      role = role;
      createdAt = Time.now();
    };
    userProfiles.add(caller, profile);

    // Assign role in access control
    accessControlState.userRoles.add(caller, roleValue);
    if (isAdmin) {
      accessControlState.adminAssigned := true;
    };

    // Create default categories for the new user
    let state = getUserState(caller);
    for ((catName, catColor) in DEFAULT_CATEGORIES.values()) {
      state.currentCategoryId += 1;
      let cat : Category.Category = {
        id = state.currentCategoryId;
        name = catName;
        description = null;
        createdAt = Time.now();
        color = ?catColor;
      };
      state.categories.add(state.currentCategoryId, cat);
    };

    #ok;
  };

  /// Verify username/password. Returns the username and role on success.
  /// The caller's principal must match the one registered for this username.
  public query ({ caller }) func verifyLogin(username : Text, passwordHash : Text) : async { #ok : UserProfile; #err : Text } {
    switch (credentialsStore.get(username)) {
      case (null) { #err("Invalid username or password") };
      case (?creds) {
        if (creds.passwordHash != passwordHash) {
          return #err("Invalid username or password");
        };
        // Verify the caller principal matches the registered principal
        switch (usernameIndex.get(username)) {
          case (null) { #err("Account not found") };
          case (?registeredPrincipal) {
            if (registeredPrincipal != caller) {
              return #err("Identity mismatch: use the correct device or re-register");
            };
            switch (userProfiles.get(caller)) {
              case (null) { #err("Profile not found") };
              case (?profile) { #ok(profile) };
            };
          };
        };
      };
    };
  };

  /// Change password for the caller.
  public shared ({ caller }) func changePassword(oldPasswordHash : Text, newPasswordHash : Text) : async { #ok; #err : Text } {
    switch (userProfiles.get(caller)) {
      case (null) { return #err("Not registered") };
      case (?profile) {
        switch (credentialsStore.get(profile.username)) {
          case (null) { return #err("Credentials not found") };
          case (?creds) {
            if (creds.passwordHash != oldPasswordHash) {
              return #err("Current password is incorrect");
            };
            let updated : Credentials = {
              username = creds.username;
              passwordHash = newPasswordHash;
              createdAt = creds.createdAt;
            };
            credentialsStore.add(creds.username, updated);
            #ok;
          };
        };
      };
    };
  };

  // ============================
  // User Profile Management
  // ============================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // ============================
  // Category management
  // ============================

  public shared ({ caller }) func createCategory(request : { name : Text; description : ?Text; color : ?Text }) : async CategoryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    state.currentCategoryId += 1;
    let entry : Category.Category = {
      id = state.currentCategoryId;
      name = request.name;
      description = request.description;
      createdAt = Time.now();
      color = request.color;
    };
    state.categories.add(state.currentCategoryId, entry);
    state.currentCategoryId;
  };

  public shared ({ caller }) func updateCategory(request : { id : CategoryId; name : Text; description : ?Text; color : ?Text }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    switch (state.categories.get(request.id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?_) {
        let entry : Category.Category = {
          id = request.id;
          name = request.name;
          description = request.description;
          createdAt = Time.now();
          color = request.color;
        };
        state.categories.add(request.id, entry);
      };
    };
  };

  public shared ({ caller }) func deleteCategory(categoryId : CategoryId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    let hasDocuments = state.documents.values().any(
      func(doc : Document.Document) : Bool { doc.categoryId == categoryId }
    );
    if (hasDocuments) { Runtime.trap("Cannot delete category with documents") };
    state.categories.remove(categoryId);
  };

  public shared ({ caller }) func deleteCategories(categoryIds : [CategoryId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    for (categoryId in categoryIds.values()) {
      let hasDocuments = state.documents.values().any(
        func(doc : Document.Document) : Bool { doc.categoryId == categoryId }
      );
      if (hasDocuments) { Runtime.trap("Cannot delete category with documents") };
      state.categories.remove(categoryId);
    };
  };

  public query ({ caller }) func getCategories() : async [Category.Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    state.categories.values().toArray();
  };

  // ===============================
  // Document management
  // ===============================

  public shared ({ caller }) func saveDocument(request : {
    categoryId : CategoryId;
    title : Text;
    fileName : Text;
    fileSize : Nat;
    mimeType : Text;
    blob : Storage.ExternalBlob;
  }) : async DocumentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    switch (state.categories.get(request.categoryId)) {
      case (null) { Runtime.trap("Category not found") };
      case (?_) {
        state.currentDocumentId += 1;
        let document : Document.Document = {
          id = state.currentDocumentId;
          title = request.title;
          fileName = request.fileName;
          fileSize = request.fileSize;
          mimeType = request.mimeType;
          categoryId = request.categoryId;
          createdAt = Time.now();
          blob = ?request.blob;
        };
        state.documents.add(state.currentDocumentId, document);
        state.currentDocumentId;
      };
    };
  };

  public shared ({ caller }) func getAllDocuments() : async [Document.Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    state.documents.values().toArray().sort(Document.compareByTimestamp);
  };

  public query ({ caller }) func getDocumentsByCategory(categoryId : CategoryId) : async [Document.Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    switch (state.categories.get(categoryId)) {
      case (null) { Runtime.trap("Category not found") };
      case (?_) {
        let filtered = state.documents.filter(
          func(_id, document) { document.categoryId == categoryId }
        );
        filtered.values().toArray().sort(Document.compareByTimestamp);
      };
    };
  };

  public query ({ caller }) func getDocument(documentId : DocumentId) : async ?Document.Document {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    state.documents.get(documentId);
  };

  public shared ({ caller }) func deleteDocument(documentId : DocumentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let state = getUserState(caller);
    switch (state.documents.get(documentId)) {
      case (null) { Runtime.trap("Document not found") };
      case (?_) { state.documents.remove(documentId) };
    };
  };

  // ===============================
  // Admin Functions
  // ===============================

  public query ({ caller }) func listAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins");
    };
    userProfiles.values().toArray();
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins");
    };
    // Remove from usernameIndex and credentialsStore
    switch (userProfiles.get(user)) {
      case (?profile) {
        credentialsStore.remove(profile.username);
        usernameIndex.remove(profile.username);
      };
      case (null) {};
    };
    userProfiles.remove(user);
    persistentState.remove(user);
    accessControlState.userRoles.remove(user);
  };

  public query ({ caller }) func getUserDocumentCount(user : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins");
    };
    switch (persistentState.get(user)) {
      case (null) { 0 };
      case (?state) { state.documents.size() };
    };
  };

  public query ({ caller }) func getUserCategoryCount(user : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins");
    };
    switch (persistentState.get(user)) {
      case (null) { 0 };
      case (?state) { state.categories.size() };
    };
  };

  /// Update the admin secret code. Only existing admins can do this.
  public shared ({ caller }) func updateAdminCode(newCode : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      return #err("Unauthorized: Only admins");
    };
    if (newCode.size() < 6) {
      return #err("Admin code must be at least 6 characters");
    };
    adminSecretCode := newCode;
    #ok;
  };

  public type Category = Category.Category;
  public type Document = Document.Document;
};
