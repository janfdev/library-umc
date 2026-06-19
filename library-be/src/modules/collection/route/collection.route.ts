import { Router } from "express";
import bibliographyRoutes from "../../bibliography/route/bibliography.route";

// Compatibility alias: /api/collections → bibliography logic
// The old collection module has been removed.
// All /api/collections routes now use the bibliography implementation.
const router = Router();

// Mount bibliography routes under /collections prefix as well
// This ensures /api/collections/* works as an alias for /api/bibliographies/*
router.use("/", bibliographyRoutes);

export { router as collectionRoutes };
