import multer from "multer";
import path from "path";
import fs from "fs";

// Asegurarnos de que la carpeta exista
const uploadDir = path.join(process.cwd(), "uploads", "maps");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único: area-168392019.png
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "map-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadMap = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5 MB
  fileFilter: (req, file, cb) => {
    // Solo aceptar imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Formato no válido. Solo se permiten imágenes (PNG, JPG, SVG)."));
    }
  },
});