export interface AuthResponse {
    success: boolean;
    message: string;
    requires_verification?: boolean;
}

export interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<{success: boolean}>;
    username: string;
    userId: number | null;
    register: (username:string, email: string, password:string) => Promise<AuthResponse>;
    // Perfil del usuario (puede ser undefined si no hay sesión)
    profile?: {
        first_name?: string;
        last_name?: string;
        area?: string;
        photo_url?: string;
        username?: string;
    };
    // Fuerza una recarga del perfil desde el backend
    refreshProfile?: () => Promise<void>;
}