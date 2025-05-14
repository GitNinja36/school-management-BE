import prisma from "../config/db.js";

// Insert into the financecheckbook table {working}
export const insertFinanceRecord = async (req, res) => {
  const { month, income, expenses, total_due_amount } = req.body;

  if (!month || income == null || expenses == null || total_due_amount == null) {
    return res.status(400).json({ error: "All fields (month, income, expenses, total_due_amount) are required" });
  }

  try {
    const finance = await prisma.financecheckbook.create({
      data: { month, income, expenses, total_due_amount }
    });

    return res.status(201).json({
      message: "Finance record added successfully",
      finance
    });
  } catch (err) {
    console.error("Error inserting finance record:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all finance checkbook records {working}
export const getFinanceRecords = async (req, res) => {
  const { month } = req.body;

  try {
    let records;

    if (month) {
      records = await prisma.financecheckbook.findMany({
        where: {
          month: {
            equals: month,
            mode: 'insensitive'
          }
        }
      });

      if (records.length === 0) {
        return res.status(404).json({ message: `No finance record found for month: ${month}` });
      }
    } else {
      records = await prisma.financecheckbook.findMany({
        orderBy: { id: 'asc' }
      });
    }

    return res.status(200).json({
      message: month ? `Finance record for ${month}` : "All finance records",
      data: records
    });
  } catch (err) {
    console.error("Error fetching finance records:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Insert into finances table {working}
export const insertFinanceEntry = async (req, res) => {
  const {
    student_name,
    total_fee,
    paid_amount,
    month,
    payment_status,
    penalty,
    expenses
  } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: {
        name: { equals: student_name, mode: 'insensitive' },
        role: 'student'
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Student not found in users table" });
    }

    const student = await prisma.students.findFirst({
      where: { user_id: user.id }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found in students table" });
    }

    const newFinance = await prisma.finances.create({
      data: {
        student_id: student.id,
        total_fee,
        paid_amount,
        month,
        payment_status,
        penalty,
        expenses
      }
    });

    res.status(201).json({
      message: "Finance record inserted successfully",
      data: newFinance
    });
  } catch (err) {
    console.error("Error inserting finance record:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all the Finance Report {working}
export const getFinanceReport = async (req, res) => {
  const { name, class: studentClass, section, month } = req.body || {};

  try {
    const records = await prisma.finances.findMany({
      where: {
        students: {
          users: {
            name: name ? { contains: name, mode: 'insensitive' } : undefined
          },
          class: studentClass || undefined,
          section: section || undefined
        },
        month: month ? { contains: month, mode: 'insensitive' } : undefined
      },
      include: {
        students: {
          include: {
            users: true
          }
        }
      }
    });

    const formatted = records.map((f) => ({
      student_name: f.students.users.name,
      student_phone: f.students.users.phone,
      student_class: f.students.class,
      student_section: f.students.section,
      total_fee: f.total_fee,
      paid_amount: f.paid_amount,
      due_amount: f.due_amount,
      month: f.month,
      payment_status: f.payment_status,
      penalty: f.penalty,
      expenses: f.expenses
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching finance report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
