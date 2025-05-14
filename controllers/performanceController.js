import prisma from "../config/db.js";

// {working}
export const getStudentPerformance = async (req, res) => {
  try {
    const {
      studentName = '',
      className = '',
      section = '',
      subject = '',
      examType = '',
      teacherName = ''
    } = req.body || {};

    const performances = await prisma.student_performance.findMany({
      where: {
        students: {
          users: {
            name: { contains: studentName, mode: 'insensitive' }
          },
          class: { contains: className, mode: 'insensitive' },
          section: { contains: section, mode: 'insensitive' }
        },
        exams: {
          subject: { contains: subject, mode: 'insensitive' },
          exam_type: { contains: examType, mode: 'insensitive' },
          teachers: {
            users: {
              name: { contains: teacherName, mode: 'insensitive' }
            }
          }
        }
      },
      include: {
        students: {
          include: {
            users: true
          }
        },
        exams: {
          include: {
            teachers: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    const result = performances.map((sp) => ({
      id: sp.id,
      student_name: sp.students?.users?.name,
      student_class: sp.students?.class,
      student_photo: sp.students?.users?.photo,
      student_section: sp.students?.section,
      phone: sp.students?.users?.phone,
      subject: sp.exams?.subject,
      exam_type: sp.exams?.exam_type,
      teacher_name: sp.exams?.teachers?.users?.name,
      exam_date: sp.exams?.exam_date,
      exam_duration: sp.exams?.exam_duration,
      marks_obtained: sp.marks_obtained,
      total_marks: sp.total_marks
    }));

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// {working}
export const createPerformance = async (req, res) => {
  try {
    const { class: targetClass, section } = req.body;

    if (!targetClass || !["A", "B", "C"].includes(section)) {
      return res.status(400).json({ error: "Invalid class or section." });
    }

    const teacher = await prisma.teachers.findFirst({
      where: {
        assigned_class: String(targetClass),
        assigned_section: section
      }
    });

    if (!teacher) {
      return res.status(404).json({
        error: `No class teacher found for class ${targetClass} and section ${section}.`
      });
    }

    const exams = await prisma.exams.findMany({
      where: {
        class: String(targetClass),
        section
      }
    });

    if (exams.length === 0) {
      return res.status(404).json({
        error: `No exams found for class ${targetClass} and section ${section}.`
      });
    }

    const students = await prisma.students.findMany({
      where: {
        class: String(targetClass),
        section
      }
    });

    if (students.length === 0) {
      return res.status(404).json({
        error: `No students found for class ${targetClass} and section ${section}.`
      });
    }

    const insertedPerformances = [];

    for (let i = 0; i < exams.length; i++) {
      const exam = exams[i];
      const classPerformanceNo = i + 1;

      const existing = await prisma.performance.findMany({
        where: {
          class: String(targetClass),
          section,
          exam_id: exam.id
        }
      });

      if (existing.length > 0) continue;

      const newPerformance = await prisma.performance.create({
        data: {
          class: String(targetClass),
          section,
          class_teacher: teacher.id,
          class_performance: classPerformanceNo,
          exam_id: exam.id
        }
      });

      insertedPerformances.push(newPerformance);
    }

    if (insertedPerformances.length === 0) {
      return res.status(200).json({
        message: "All performance records already exist. No new entries added."
      });
    }

    return res.status(201).json({
      message: "Performance records inserted successfully where missing.",
      performances: insertedPerformances
    });
  } catch (error) {
    console.error("Error creating performance:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// {Working}
export const insertStudentPerformance = async (req, res) => {
  try {
    const {
      roll_number,
      class: studentClass,
      section,
      subject,
      exam_type,
      marks_obtained,
      total_marks
    } = req.body;

    const student = await prisma.students.findFirst({
      where: {
        roll_number,
        class: studentClass,
        section
      }
    });

    if (!student) {
      return res.status(404).json({
        error: `No student found with roll number "${roll_number}" in class "${studentClass}" section "${section}". Please verify the details.`
      });
    }

    const exam = await prisma.exams.findFirst({
      where: {
        class: studentClass,
        section,
        subject,
        exam_type
      }
    });

    if (!exam) {
      return res.status(404).json({
        error: `No scheduled exam found for subject "${subject}", exam type "${exam_type}" in class "${studentClass}" section "${section}". Please ensure the exam is scheduled.`
      });
    }

    const existing = await prisma.student_performance.findFirst({
      where: {
        student_id: student.id,
        exam_id: exam.id
      }
    });

    if (existing) {
      return res.status(400).json({
        error: `Performance for student with roll number "${roll_number}" has already been recorded for this exam.`
      });
    }

    const performance = await prisma.student_performance.create({
      data: {
        student_id: student.id,
        exam_id: exam.id,
        marks_obtained,
        total_marks
      }
    });

    return res.status(201).json({
      message: "Performance added successfully.",
      data: performance
    });
  } catch (error) {
    console.error("Insert error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};