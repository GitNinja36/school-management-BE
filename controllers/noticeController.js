import prisma from "../config/db.js";

// Add Notice {working}
export const addNotice = async (req, res) => {
  try {
    const { title, content, target_role } = req.body;
    const userType = req.headers["user"];
    const name = req.headers["name"];

    if (!userType || !name) {
      return res.status(400).json({ error: "User type and name must be provided in headers." });
    }
    if (!title || !content || !target_role) {
      return res.status(400).json({ error: "Title, content and target role are required." });
    }

    const user = await prisma.users.findFirst({
      where: {
        name,
        role: userType.toLowerCase()
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found with given name and role." });
    }

    await prisma.notices.create({
      data: {
        title,
        content,
        target_role,
        created_by: user.id,
        created_at: new Date()
      }
    });

    res.status(201).json({ message: "Notice added successfully." });
  } catch (error) {
    console.error("Error inserting notice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Notices {working}
export const getNotice = async (req, res) => {
  try {
    const notices = await prisma.notices.findMany({
      include: {
        users: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};