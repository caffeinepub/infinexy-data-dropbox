import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Category {
    id: bigint;
    name: string;
    createdAt: Time;
    color?: string;
    description?: string;
}
export type Time = bigint;
export type DocumentId = bigint;
export interface Document {
    id: DocumentId;
    categoryId: CategoryId;
    title: string;
    blob?: ExternalBlob;
    createdAt: Time;
    mimeType: string;
    fileName: string;
    fileSize: bigint;
}
export type CategoryId = bigint;
export interface UserProfile {
    username: string;
    createdAt: Time;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export type RegisterResult = { ok: null } | { err: string };
export type LoginResult = { ok: UserProfile } | { err: string };
export type ChangePasswordResult = { ok: null } | { err: string };
export type UpdateAdminCodeResult = { ok: null } | { err: string };
export interface backendInterface {
    // Auth
    register(username: string, passwordHash: string, adminCode: string | null): Promise<RegisterResult>;
    verifyLogin(username: string, passwordHash: string): Promise<LoginResult>;
    changePassword(oldPasswordHash: string, newPasswordHash: string): Promise<ChangePasswordResult>;
    // User
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    // Categories
    createCategory(request: { name: string; color?: string; description?: string; }): Promise<CategoryId>;
    deleteCategories(categoryIds: Array<CategoryId>): Promise<void>;
    deleteCategory(categoryId: CategoryId): Promise<void>;
    getCategories(): Promise<Array<Category>>;
    updateCategory(request: { id: CategoryId; name: string; color?: string; description?: string; }): Promise<void>;
    // Documents
    deleteDocument(documentId: DocumentId): Promise<void>;
    getAllDocuments(): Promise<Array<Document>>;
    getDocument(documentId: DocumentId): Promise<Document | null>;
    getDocumentsByCategory(categoryId: CategoryId): Promise<Array<Document>>;
    saveDocument(request: { categoryId: CategoryId; title: string; blob: ExternalBlob; mimeType: string; fileName: string; fileSize: bigint; }): Promise<DocumentId>;
    // Admin
    deleteUser(user: Principal): Promise<void>;
    getUserCategoryCount(user: Principal): Promise<bigint>;
    getUserDocumentCount(user: Principal): Promise<bigint>;
    listAllUsers(): Promise<Array<UserProfile>>;
    updateAdminCode(newCode: string): Promise<UpdateAdminCodeResult>;
}
