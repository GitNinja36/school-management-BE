import prisma from "../config/db.js";

export const getStudentProfile = async (req, res) => {
    try {
      const student = await prisma.students.findUnique({
        where: { id: req.user.id },
      });
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
};

// this function will give you studnet routine {working}
export const getStudentRoutine = async (req, res) => {
    try {
      const {
        className = '',
        section = '',
        timeSlot = '',
        teacherName = '',
        teacherSubject = '',
        day = ''
      } = req.body || {};
  
      const routines = await prisma.student_routine.findMany({
        where: {
          class: { contains: className, mode: 'insensitive' },
          section: { contains: section, mode: 'insensitive' },
          time_slot: { contains: timeSlot, mode: 'insensitive' },
          teacher_name: { contains: teacherName, mode: 'insensitive' },
          teacher_subject: { contains: teacherSubject, mode: 'insensitive' },
          day: { contains: day, mode: 'insensitive' },
        },
      });
  
      res.json(routines);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
};
  
// this function will give you the monthly status of student {working}
export const getClassMonthlyAttendance = async (req, res) => {
    try {
      const { className = '', section = '' } = req.body || {};
  
      const rawQuery = `
        SELECT 
          s.class,
          s.section,
          COUNT(*) FILTER (WHERE a.status = 'Present') AS total_present,
          (
            CASE EXTRACT(MONTH FROM a.date)
              WHEN 1 THEN 31
              WHEN 2 THEN 
                CASE 
                  WHEN EXTRACT(YEAR FROM a.date)::INT % 4 = 0 AND 
                       (EXTRACT(YEAR FROM a.date)::INT % 100 != 0 OR EXTRACT(YEAR FROM a.date)::INT % 400 = 0)
                  THEN 29
                  ELSE 28
                END
              WHEN 3 THEN 31
              WHEN 4 THEN 30
              WHEN 5 THEN 31
              WHEN 6 THEN 30
              WHEN 7 THEN 31
              WHEN 8 THEN 31
              WHEN 9 THEN 30
              WHEN 10 THEN 31
              WHEN 11 THEN 30
              WHEN 12 THEN 31
            END
          ) AS monthly_total
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE 
          ($1 = '' OR s.class::TEXT ILIKE $1)
          AND ($2 = '' OR s.section ILIKE $2)
        GROUP BY s.class, s.section, EXTRACT(MONTH FROM a.date), EXTRACT(YEAR FROM a.date)
        ORDER BY s.class, s.section;
      `;
  
      const result = await prisma.$queryRawUnsafe(rawQuery, `%${className}%`, `%${section}%`);
  
      // Convert any BigInt values to Number
      const safeResult = result.map(row => {
        const convertedRow = {};
        for (const key in row) {
          convertedRow[key] = typeof row[key] === 'bigint' ? Number(row[key]) : row[key];
        }
        return convertedRow;
      });
  
      res.json(safeResult);
    } catch (error) {
      console.error("Error fetching class monthly attendance:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
};
  
// this function will give you the status of studnet {working}
export const getStudentAttendance = async (req, res) => {
    try {
      const {
        studentName = '',
        className = '',
        section = '',
        date = '',
        status = '',
        month = ''
      } = req.body || {};

      const monthNames = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
  
      const formatMonth = (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
      const normalizedMonth = formatMonth(month || '');
      const monthNumber = monthNames[normalizedMonth] || null;
  
      const query = `
        SELECT 
          u.name AS student_name,
          s.class,
          s.section,
          tu.name AS class_teacher,
          a.date,
          a.status
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN teachers t ON a.teacher_id = t.id
        JOIN users tu ON t.user_id = tu.id
        WHERE 
          ($1 = '' OR u.name ILIKE $1)
          AND ($2 = '' OR s.class::TEXT ILIKE $2)
          AND ($3 = '' OR s.section ILIKE $3)
          AND ($4 = '' OR a.date::TEXT ILIKE $4)
          AND ($5 = '' OR a.status ILIKE $5)
          AND ($6::INT IS NULL OR EXTRACT(MONTH FROM a.date) = $6::INT)
      `;
  
      const result = await prisma.$queryRawUnsafe(query,
        `%${studentName}%`, `%${className}%`, `%${section}%`, `%${date}%`, `%${status}%`, monthNumber);
  
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
};
  
// this function will add studnet status {working}
export const createAttendance = async (req, res) => {
    try {
      const { name: headerName, user: headerRole } = req.headers;
      const { name, class: classNum, section, roll_number, status, date } = req.body;
  
      if (!["present", "absent", "medical"].includes(status.toLowerCase())) {
        return res.status(400).json({ error: "Status must be Present, Absent, or Medical." });
      }
  
      const user = await prisma.users.findFirst({
        where: {
          name: headerName,
          role: headerRole
        },
      });
  
      if (!user) {
        return res.status(404).json({
          error: `No ${headerRole} found with the name "${headerName}".`,
        });
      }
  
      const teacher = await prisma.teachers.findFirst({
        where: { user_id: user.id },
      });
  
      if (!teacher) {
        return res.status(404).json({
          error: `No teacher found linked to user "${headerName}".`,
        });
      }
  
      const student = await prisma.students.findFirst({
        where: {
          class: String(classNum),
          section: section,
          roll_number: roll_number,
        },
      });
  
      if (!student) {
        return res.status(404).json({
          error: `No student found in class ${classNum}${section} with roll number ${roll_number}.`,
        });
      }
  
    const formattedDate = date
    ? new Date(date)
    : new Date(new Date().toISOString().split('T')[0]);
    
    const attendance = await prisma.attendance.create({
      data: {
        student_id: student.id,
        teacher_id: teacher.id,
        class: parseInt(classNum),
        section,
        date: formattedDate,
        status,
      },
    });
  
      return res.status(201).json({
        message: "Attendance recorded successfully.",
        attendance,
      });
    } catch (error) {
      console.error("Error adding attendance:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
};