export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  role: "admin" | "user";
  must_change_password: boolean;
  is_bootstrap_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  token: string;
  must_change_password: boolean;
  user: AuthUser;
};
