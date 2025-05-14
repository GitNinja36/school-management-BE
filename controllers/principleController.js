import prisma from "../config/db.js";

// get all studnet data and also get specific studnet data  {working}
export const getStudents = async (req, res) => {
    try {
        const {
            name = '',
            class: studentClass = '',
            section = '',
            parent_name = '',
            admission_number = ''
        } = req.body || {};

        const students = await prisma.students.findMany({
            where: {
                ...(studentClass && { class: studentClass }),
                ...(section && { section }),
                ...(admission_number && { admission_number }),
                ...(parent_name && { parent_name: { contains: parent_name, mode: 'insensitive' } }),
                ...(name && {
                    users: {
                        name: { contains: name, mode: 'insensitive' }
                    }
                })
            },
            include: {
                users: {
                    select: {
                        name: true,
                        photo: true,
                        phone: true,
                    }
                }
            }
        });

        const result = students.map(s => ({
            id: s.id,
            user_id: s.user_id,
            student_name: s.users?.name,
            student_photo: s.users?.photo,
            student_phone: s.users?.phone,
            admission_number: s.admission_number,
            class: s.class,
            section: s.section,
            parent_name: s.parent_name,
            parent_phone: s.parent_phone,
            parent_email: s.parent_email,
            parent_work: s.parent_work,
            parent_photo1: s.parent_photo1,
            parent_photo2: s.parent_photo2,
            guardian_photo: s.guardian_photo,
            guardian_phone: s.guardian_phone
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// get all the Parents data {working}
export const getParentProfile = async (req, res) => {
    try {
        const students = await prisma.students.findMany({
            include: {
                users: {
                    select: {
                        address: true,
                        name: true,
                        phone: true,
                        photo: true
                    }
                }
            }
        });

        const result = students.map(s => ({
            parent_name: s.parent_name,
            parent_phone: s.parent_phone,
            parent_email: s.parent_email,
            parent_work: s.parent_work,
            parent_photo1: s.parent_photo1,
            parent_photo2: s.parent_photo2,
            guardian_photo: s.guardian_photo,
            class: s.class,
            section: s.section,
            student_name: s.users?.name,
            student_phone: s.users?.phone,
            student_photo: s.users?.photo,
            address: s.users?.address
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching parent profiles:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// get particular parent data {working}
export const getSpecificParentProfile = async (req, res) => {
    try {
        const { name = '', class: studentClass = '', section = '', admission_number = '' } = req.body;

        const students = await prisma.students.findMany({
            where: {
                ...(studentClass && { class: studentClass }),
                ...(section && { section }),
                ...(admission_number && { admission_number }),
                ...(name && {
                    users: {
                        name: { contains: name, mode: 'insensitive' }
                    }
                })
            },
            include: {
                users: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });

        if (!students.length) {
            return res.status(404).json({ error: "No matching parent/student found." });
        }

        const result = students.map(s => ({
            parent_name: s.parent_name,
            parent_phone: s.parent_phone,
            parent_email: s.parent_email,
            parent_work: s.parent_work,
            student_name: s.users?.name,
            class: s.class,
            section: s.section,
            admission_number: s.admission_number,
            student_phone: s.users?.phone
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching specific parent profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

