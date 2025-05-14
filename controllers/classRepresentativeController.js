import prisma  from "../config/db.js";

// Insert class representative {working}
export const insertClassRepresentative = async (req, res) => {
    const { name, class: studentClass, section } = req.body;

    try {
        // Find student user 
        const user = await prisma.users.findFirst({
            where: {
                name,
                role: 'student',
            },
        });

        if (!user) {
            return res.status(404).json({ error: "Student not found in users table" });
        }

        // Find matching student
        const student = await prisma.students.findFirst({
            where: {
                user_id: user.id,
                class: studentClass,
                section,
            },
        });

        if (!student) {
            return res.status(404).json({
                error: "Student not found in students table with provided class and section",
            });
        }

        // Check current CR count 
        const crCount = await prisma.class_representatives.count({
            where: {
                class: studentClass,
                section,
            },
        });

        if (crCount >= 2) {
            return res.status(400).json({
                error: "Maximum class representatives already assigned for this section of class",
            });
        }

        // Insert class representative
        const newCR = await prisma.class_representatives.create({
            data: {
                student_id: student.id,
                class: studentClass,
                section,
            },
        });

        res.status(201).json({ message: "Class representative added", data: newCR });

    } catch (err) {
        console.error("Error inserting class representative:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Get all class representatives {working}
export const getClassRepresentatives = async (req, res) => {
    try {
        const crs = await prisma.class_representatives.findMany({
            select: {
                id: true,
                class: true,
                section: true,
                students: {
                    select: {
                        users: {
                            select: {
                                name: true,
                                photo: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        // Flatten response structure
        const formatted = crs.map(cr => ({
            id: cr.id,
            name: cr.students.users.name,
            photo: cr.students.users.photo,
            phone: cr.students.users.phone,
            class: cr.class,
            section: cr.section,
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Error fetching class representatives:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}; 