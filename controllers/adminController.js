import prisma from "../config/db.js";

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