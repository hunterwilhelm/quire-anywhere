export interface ApiRequest {
  method?: string;
  headers: { origin?: string };
  body: unknown;
}

export interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): this;
  json(value: unknown): this;
  end(): this;
}
