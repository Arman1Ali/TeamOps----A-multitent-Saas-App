/**
 * The API's own vocabulary, written down in TypeScript.
 *
 * Every type here mirrors one response model in Backend/teamops/app/schemas/.
 * They are kept together in one file, and kept separate from src/types/ui.ts,
 * so that a change on either side is obvious: when the backend renames a field,
 * this file is where the compiler starts complaining, and only this file.
 *
 * Reading them is a good way to learn the API - they are the shapes the
 * endpoints return, and the comments say which endpoint each one comes from.
 */

// ---------------------------------------------------------------------------
// Values that are one of a fixed list. They match the Literal(...) types in
// the schemas exactly, so a value the backend would reject is caught here
// first, before a request is even made.
// ---------------------------------------------------------------------------

/** Literal["On track", "At risk", "Blocked", "Done"] in schemas/Project.py */
export type ApiProjectStatus = "On track" | "At risk" | "Blocked" | "Done";

/** Literal["To do", "In progress", "Done"] in schemas/task.py */
export type ApiTaskStatus = "To do" | "In progress" | "Done";

/** Literal["High", "Medium", "Low"] in schemas/task.py */
export type ApiTaskPriority = "High" | "Medium" | "Low";

/** Literal["owner", "admin", "member"] in schemas/user.py */
export type ApiUserRole = "owner" | "admin" | "member";

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/** schemas/common.py -> UserBrief: a person, as seen from another resource. */
export type ApiUserBrief = {
  id: number;
  name: string;
  email: string;
  role: ApiUserRole;
  /** Derived on the server from the name, so initials never drift. */
  initials: string;
};

/** schemas/common.py -> ProjectBrief: how a task names its project. */
export type ApiProjectBrief = {
  id: number;
  name: string;
};

/** schemas/common.py -> CompanyBrief: how a user names their workspace. */
export type ApiCompanyBrief = {
  id: number;
  name: string;
};

/** schemas/common.py -> CompanyDetail: GET /companies/{id}. */
export type ApiCompanyDetail = {
  id: number;
  name: string;
  users: ApiUserBrief[];
  projects: ApiProjectBrief[];
};

/** schemas/Project.py -> ProjectResponse: GET/POST/PUT /projects. */
export type ApiProject = {
  id: number;
  name: string;
  description: string;
  status: ApiProjectStatus;
  progress: number;
  /** "YYYY-MM-DD", or null when no deadline has been set. */
  due_date: string | null;
  company_id: number;
  created_at: string;
  updated_at: string;
};

/** schemas/task.py -> TaskResponse: GET/POST/PUT /tasks. */
export type ApiTask = {
  id: number;
  title: string;
  description: string;
  status: ApiTaskStatus;
  priority: ApiTaskPriority;
  project_id: number;
  assigned_to: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  /** The project, already named - no second request needed to show it. */
  project: ApiProjectBrief;
  /** Null when nobody has taken the task yet. */
  assignee: ApiUserBrief | null;
};

/** schemas/user.py -> UserResponse: GET/POST/PUT /users, and GET /auth/me. */
export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: ApiUserRole;
  company_id: number;
  initials: string;
  company: ApiCompanyBrief | null;
  created_at: string;
};

/** schemas/auth.py -> TokenResponse: POST /auth/login, /register, /refresh. */
export type ApiTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

// ---------------------------------------------------------------------------
// Requests - the bodies this frontend sends
// ---------------------------------------------------------------------------

/** schemas/Project.py -> ProjectCreate */
export type ApiProjectCreate = {
  name: string;
  description?: string;
  status?: ApiProjectStatus;
  progress?: number;
  due_date?: string | null;
};

/** schemas/Project.py -> ProjectUpdate: every field optional. */
export type ApiProjectUpdate = Partial<ApiProjectCreate>;

/** schemas/task.py -> TaskCreate */
export type ApiTaskCreate = {
  title: string;
  description?: string;
  status?: ApiTaskStatus;
  priority?: ApiTaskPriority;
  project_id: number;
  assigned_to?: number | null;
  due_date?: string | null;
};

/** schemas/task.py -> TaskUpdate. */
export type ApiTaskUpdate = Partial<ApiTaskCreate>;

/** schemas/user.py -> UserCreate: inviting a teammate. */
export type ApiUserCreate = {
  name: string;
  email: string;
  /** The backend requires at least 8 characters. */
  password: string;
  /**
   * The schema allows all three roles, so the type does too - and that is not
   * a loophole. app/services/user.py refuses anybody but the workspace owner
   * who tries to hand out "owner", so the server decides what a caller may
   * send, exactly as it decides which workspace the newcomer lands in.
   */
  role?: ApiUserRole;
};

/** What GET /projects and GET /tasks accept as query parameters. */
export type ApiListParams = {
  page?: number;
  /** The backend caps this at 100 and answers 422 above it. */
  limit?: number;
  sort?: string;
  search?: string;
  project_id?: number;
  assigned_to?: number;
  status?: string;
};
