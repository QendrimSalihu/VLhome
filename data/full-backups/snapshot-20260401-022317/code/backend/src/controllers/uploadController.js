import path from "node:path";
import { created } from "../utils/apiResponse.js";

export function uploadImageController(req, res) {
  if (!req.file) {
    throw new Error("No file uploaded");
  }
  const relativePath = `/uploads/${path.basename(req.file.path)}`;
  return created(res, { path: relativePath }, "Uploaded");
}
