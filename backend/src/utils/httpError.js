export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = Number(statusCode) || 500;
  }
}

export function badRequest(message) {
  return new HttpError(400, message);
}

export function unauthorized(message = "Nuk je i autorizuar.") {
  return new HttpError(401, message);
}
