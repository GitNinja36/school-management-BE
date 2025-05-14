import prisma from "../config/db.js";

export const getTeachers = async (req, res) => {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: "teacher" },
      });
      res.json(teachers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
};
  
// this function will give you all class teachers info  {problem} 
export const getClassTeacher = async (req, res) => {
    try {
      const classTeachers = await prisma.class_teachers.findMany({
        include: {
          teachers: {
            include: {
              users: true,
            },
          },
          class_representative_student_id: {
            include: {
              users: true,
            },
          },
          second_class_representative_student_id: {
            include: {
              users: true,
            },
          },
        },
        orderBy: [
          { class: "asc" },
          { section: "asc" },
        ],
      });
  
      const result = classTeachers.map((ct) => ({
        teacher_id: ct.teachers.id,
        teacher_name: ct.teachers.users.name,
        teacher_photo: ct.teachers.users.photo,
        class: ct.class,
        section: ct.section,
        cr1_name: ct.class_representative_student_id?.user?.name,
        cr1_phone: ct.class_representative_student_id?.user?.phone,
        cr1_photo: ct.class_representative_student_id?.user?.photo,
        cr2_name: ct.second_class_representative_student_id?.user?.name,
        cr2_phone: ct.second_class_representative_student_id?.user?.phone,
        cr2_photo: ct.second_class_representative_student_id?.user?.photo,
      }));
  
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
};

// {problem}
export const getSpecificClassTeacher = async (req, res) => {
    try {
      const { teacherName = '', className = '', section = '', crName = '' } = req.body;
  
      const teachers = await prisma.class_teachers.findMany({
        where: {
          class: className ? { contains: className, mode: 'insensitive' } : undefined,
          section: section ? { contains: section, mode: 'insensitive' } : undefined,
          teachers: {
            users: {
              name: teacherName ? { contains: teacherName, mode: 'insensitive' } : undefined,
            },
          },
          OR: crName
            ? [
                {
                  students: {
                    users: {
                      name: { contains: crName, mode: 'insensitive' },
                    },
                  },
                },
                {
                  second_class_representative_student_id: {
                    equals: undefined, // Prisma doesn't support two different paths in OR across relations, so manual filtering may be needed here if necessary.
                  },
                },
              ]
            : undefined,
        },
        include: {
          teachers: {
            include: {
              users: true,
            },
          },
          students: {
            include: {
              users: true,
            },
          },
          second_class_representative_student_id: true, // Prisma limitation — can’t deeply nest multiple optional relations. You can join manually if needed.
        },
        orderBy: [{ class: 'asc' }, { section: 'asc' }],
      });
  
      // Mapping result
      const formatted = teachers.map((ct) => ({
        teacher_id: ct.teachers.id,
        teacher_name: ct.teachers.users?.name,
        teacher_photo: ct.teachers.users?.photo,
        class: ct.class,
        section: ct.section,
        cr1_name: ct.students?.users?.name || null,
        cr1_phone: ct.students?.users?.phone || null,
        cr1_photo: ct.students?.users?.photo || null,
        cr2_name: null, // Not directly joinable with Prisma in this case
        cr2_phone: null,
        cr2_photo: null,
      }));
  
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong.' });
    }
};
  
// this function will give you the particular Class Routine of teacher {working}
export const getTeacherRoutine = async (req, res) => {
    try {
      const { teacherName = '', className = '', section = '', day = '', timeSlot = '' } = req.body;
  
      const routines = await prisma.teacher_routine.findMany({
        where: {
          day: day ? { contains: day, mode: 'insensitive' } : undefined,
          class: className ? { contains: className, mode: 'insensitive' } : undefined,
          section: section ? { contains: section, mode: 'insensitive' } : undefined,
          time_slot: timeSlot ? { contains: timeSlot, mode: 'insensitive' } : undefined,
          users: {
            name: teacherName ? { contains: teacherName, mode: 'insensitive' } : undefined,
          },
        },
        include: {
          users: true,
        },
      });
  
      const formatted = routines.map((routine) => ({
        id: routine.id,
        teacher_name: routine.users.name,
        teacher_subject: routine.users.teachers?.specialised_subject || null,
        day: routine.day,
        class: routine.class,
        section: routine.section,
        time_slot: routine.time_slot,
      }));
  
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong.' });
    }
};
 
// this function will give you the particular Class exams {working}
export const getFilteredExams = async (req, res) => {
    try {
      const {
        className = '',
        section = '',
        examDate = '',
        subject = '',
        examDuration = '',
        examType = ''
      } = req.body || {};
  
      const exams = await prisma.exams.findMany({
        where: {
          class: { contains: className, mode: 'insensitive' },
          section: { contains: section, mode: 'insensitive' },
          exam_date: examDate ? { equals: new Date(examDate) } : undefined,
          subject: { contains: subject, mode: 'insensitive' },
          exam_duration: { contains: examDuration, mode: 'insensitive' },
          exam_type: { contains: examType, mode: 'insensitive' }
        },
        select: {
          id: true,
          class: true,
          section: true,
          subject: true,
          exam_date: true,
          exam_duration: true,
          exam_type: true
        }
      });
  
      res.json(exams);
    } catch (error) {
      console.error("Error fetching filtered exams:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
};
  
// this function will help you to add new Exam {working}
export const insertExam = async (req, res) => {
    const {
      class: studentClass,
      section,
      subject,
      exam_date,
      exam_duration,
      exam_type
    } = req.body;
  
    const teacherName = req.headers.name;
    const userRole = req.headers.user;
  
    if (!teacherName || userRole !== "teacher") {
      return res.status(401).json({ error: "Unauthorized or invalid role" });
    }
  
    try {
      // 1. Find the teacher's user ID
      const user = await prisma.users.findFirst({
        where: {
          name: teacherName,
          role: 'teacher'
        },
        select: { id: true }
      });
  
      if (!user) {
        return res.status(404).json({ error: "Teacher not found in users table" });
      }
  
      // 2. Find the teacher's ID from teachers table
      const teacher = await prisma.teachers.findFirst({
        where: {
          user_id: user.id
        },
        select: { id: true }
      });
  
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found in teachers table" });
      }
  
      // 3. Insert exam
      const newExam = await prisma.exams.create({
        data: {
          class: studentClass,
          section,
          subject,
          exam_date: new Date(exam_date),
          exam_duration,
          exam_type,
          created_by: teacher.id
        }
      });
  
      return res.status(201).json({
        message: "Exam successfully created",
        exam: newExam
      });
    } catch (err) {
      console.error("Error inserting exam:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
};

// this function will give you the particular Assignment info{working}
export const getAssignments = async (req, res) => {
    try {
      const {
        title = '',
        subject = '',
        className = '',
        section = '',
        teacherName = ''
      } = req.body || {};
  
      const assignments = await prisma.assignments.findMany({
        where: {
          title: title ? { contains: title, mode: 'insensitive' } : undefined,
          subject: subject ? { contains: subject, mode: 'insensitive' } : undefined,
          class: className ? { contains: className, mode: 'insensitive' } : undefined,
          section: section ? { contains: section, mode: 'insensitive' } : undefined,
          teachers: teacherName
            ? {
                users: {
                  name: {
                    contains: teacherName,
                    mode: 'insensitive'
                  }
                }
              }
            : undefined
        },
        include: {
          teachers: {
            include: {
              users: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
  
      const formatted = assignments.map(a => ({
        title: a.title,
        description: a.description,
        subject: a.subject,
        class: a.class,
        section: a.section,
        assigned_by: a.teachers?.users?.name || null,
        due_date: a.due_date,
        file: a.file
      }));
  
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
};

// this function will help you to add new assignment {working}
export const insertAssignment = async (req, res) => {
    const { class: studentClass, section, title, description, file } = req.body;
    const teacherName = req.headers.name;
    const userRole = req.headers.user;
  
    if (!teacherName || userRole !== "teacher") {
      return res.status(401).json({ error: "Unauthorized or invalid user role" });
    }
  
    try {
      const user = await prisma.users.findFirst({
        where: {
          name: teacherName,
          role: 'teacher'
        }
      });
  
      if (!user) {
        return res.status(404).json({ error: "Teacher not found in users table" });
      }
  
      const teacher = await prisma.teachers.findFirst({
        where: {
          user_id: user.id
        }
      });
  
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found in teachers table" });
      }
  
      const due_date = new Date(); // Current date
  
      const newAssignment = await prisma.assignments.create({
        data: {
          title,
          description,
          subject: teacher.specialised_subject,
          class: studentClass,
          section,
          assigned_by: teacher.id,
          due_date,
          file
        }
      });
  
      res.status(201).json({ message: "Assignment added successfully", assignment: newAssignment });
    } catch (err) {
      console.error("Error inserting assignment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
};