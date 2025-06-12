import { authenticateUser } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import express from "express";
import { addStudent, addTeacher, insertRoutine, updateUser, deleteUser, updateUserPassword} from "../controllers/adminController.js";

const router = express.Router();

router.post("/student", authenticateUser, authorizeRoles("admin", "principal"),addStudent);
router.post("/teacher", addTeacher);
router.post("/routine/create", insertRoutine);
router.put("/user/update/:id", updateUser);
router.delete("/user/delete/:id", deleteUser);
router.put("/user/password", updateUserPassword);

export default router;