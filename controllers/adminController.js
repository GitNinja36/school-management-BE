import prisma from "../config/db.js";
import bcrypt from 'bcrypt';

// Add Student {working}
export const addStudent = async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        address,
        photo,
        admission_number,
        class: studentClass,
        section,
        parent_name,
        parent_phone,
        parent_email,
        parent_work,
        parent_photo1,
        parent_photo2,
        guardian_photo = null,
        guardian_phone = null
    } = req.body;

    if (!name || !email || !password || !admission_number || !studentClass || !section || !parent_name) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: "student",
                phone,
                address,
                photo,
                student: {
                    create: {
                        admission_number,
                        class: studentClass,
                        section,
                        parent_name,
                        parent_phone,
                        parent_email,
                        parent_work,
                        parent_photo1,
                        parent_photo2,
                        guardian_photo,
                        guardian_phone
                    }
                }
            }
        });

        res.status(201).json({ message: "Student added successfully.", userId: user.id });
    } catch (error) {
        console.error("Error inserting student:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Add Teacher {working}
export const addTeacher = async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        address,
        photo,
        specialised_subject,
        assigned_class,
        assigned_section
    } = req.body;

    if (!name || !email || !password || !phone || !specialised_subject || !assigned_class || !assigned_section) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const existingClassTeacher = await prisma.teacher.findFirst({
            where: {
                assigned_class,
                assigned_section
            }
        });

        if (existingClassTeacher) {
            return res.status(400).json({ error: `Class ${assigned_class} section ${assigned_section} already has a class teacher.` });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: "teacher",
                phone,
                address,
                photo,
                teacher: {
                    create: {
                        specialised_subject,
                        assigned_class,
                        assigned_section
                    }
                }
            }
        });

        res.status(201).json({ message: "Teacher added successfully.", userId: user.id });
    } catch (error) {
        console.error("Error inserting teacher:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Insert Routine {working}
export const insertRoutine = async (req, res) => {
    const { day, time_slot, class: studentClass, section } = req.body;
    const teacherName = req.headers.name;
    const userRole = req.headers.user;

    if (!teacherName || userRole !== "teacher") {
        return res.status(401).json({ error: "Unauthorized or invalid role" });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                name: teacherName,
                role: "teacher"
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Teacher not found in users table" });
        }

        const teacher = await prisma.teacher.findFirst({
            where: {
                user_id: user.id
            }
        });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found in teachers table" });
        }

        const teacherRoutine = await prisma.teacherRoutine.create({
            data: {
                teacher_id: teacher.id,
                day,
                time_slot,
                class: studentClass,
                section
            }
        });

        const studentRoutine = await prisma.studentRoutine.create({
            data: {
                class: studentClass,
                section,
                day,
                teacher_id: teacher.id,
                teacher_name: user.name,
                teacher_subject: teacher.specialised_subject,
                time_slot
            }
        });

        return res.status(201).json({
            message: "Routine inserted for both teacher and student",
            teacherRoutine,
            studentRoutine
        });

    } catch (err) {
        console.error("Routine insertion error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        email,
        password,
        phone,
        address,
        photo,
        role,
        specialised_subject,
        assigned_class,
        assigned_section,
        admission_number,
        section,
        parent_name,
        parent_phone
    } = req.body;

    try {
        // Update main user table
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                password,
                phone,
                address,
                photo
            }
        });

        // Update teacher if role is teacher
        if (role === "teacher") {
            await prisma.teacher.updateMany({
                where: { user_id: updatedUser.id },
                data: {
                    specialised_subject,
                    assigned_class,
                    assigned_section
                }
            });
        }

        // Update student if role is student
        if (role === "student") {
            await prisma.student.updateMany({
                where: { user_id: updatedUser.id },
                data: {
                    admission_number,
                    section,
                    parent_name,
                    parent_phone
                }
            });
        }

        res.status(200).json({ message: "User updated successfully" });

    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete from teachers or students table first
        if (user.role === "teacher") {
            await prisma.teacher.deleteMany({ where: { user_id: user.id } });
        }

        if (user.role === "student") {
            await prisma.student.deleteMany({ where: { user_id: user.id } });
        }

        // Then delete from users table
        await prisma.user.delete({ where: { id: user.id } });

        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateUserPassword = async (req, res) => {
    const { email, role, newPassword } = req.body;

    if (!email || !role || !newPassword) {
        return res.status(400).json({ error: "Email, role, and new password are required" });
    }

    try {
        const user = await prisma.users.findFirst({
            where: { email, role }
        });

        if (!user) {
            return res.status(404).json({ error: `User with role '${role}' not found.` });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Password update error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};