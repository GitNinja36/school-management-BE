import prisma from "../config/db.js";

// Insert a new note {working}
export const insertNote = async (req, res) => {
  const { user, name } = req.headers;
  const { title, content, subject, class: noteClass, section, files } = req.body;

  try {
    if (user !== "teacher") {
      return res.status(403).json({ error: "Only teachers can create notes." });
    }

    const teacherUser = await prisma.users.findFirst({
      where: {
        name,
        role: "teacher",
      },
    });

    if (!teacherUser) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const createdNote = await prisma.notes.create({
      data: {
        title,
        content,
        subject,
        class: noteClass,
        section,
        created_by: teacherUser.id,
        files: files || null,
        created_at: new Date(),
      },
    });

    res.status(201).json({ message: "Note created successfully", note: createdNote });
  } catch (err) {
    console.error("Error inserting note:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all notes with optional filters {working}
export const getNotes = async (req, res) => {
  try {
    const {
      title = '',
      givenBy = '',
      uploadedBy = '',
      className = '',
      section = '',
      subject = ''
    } = req.body || {};

    const notes = await prisma.notes.findMany({
      where: {
        title: { contains: title, mode: 'insensitive' },
        content: { contains: givenBy, mode: 'insensitive' },
        subject: { contains: subject, mode: 'insensitive' },
        class: { contains: className, mode: 'insensitive' },
        section: { contains: section, mode: 'insensitive' },
        users: {
          name: { contains: uploadedBy, mode: 'insensitive' }
        }
      },
      include: {
        users: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const result = notes.map(note => ({
      title: note.title,
      given_by: note.content,
      uploaded_by: note.users?.name || "Unknown",
      class: note.class,
      section: note.section,
      subject: note.subject,
      files: note.files,
      date: note.created_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching filtered notes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};