import prisma  from "../config/db.js";

// Add a calendar entry {working}
export const addCalendarEntry = async (req, res) => {
    const { month, calendar, year } = req.body;

    if (!month || !calendar || !year) {
        return res.status(400).json({ error: "Month, calendar image name, and year are required." });
    }

    try {
        await prisma.calendar.create({
            data: {
                month,
                calendar,
                year: parseInt(year),
            },
        });

        res.status(201).json({ message: "Calendar entry added successfully." });
    } catch (error) {
        console.error("Error adding calendar entry:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get specific calendar by month {working}
export const getSpecificCalendar = async (req, res) => {
    const { month = '' } = req.body;

    try {
        let calendars;

        if (month.trim() === '') {
            calendars = await prisma.calendar.findMany();
        } else {
            calendars = await prisma.calendar.findMany({
                where: {
                    month: {
                        equals: month,
                        mode: "insensitive",
                    },
                },
            });
        }

        // Sort manually by month order and year
        const monthOrder = {
            January: 1, February: 2, March: 3, April: 4,
            May: 5, June: 6, July: 7, August: 8,
            September: 9, October: 10, November: 11, December: 12,
        };

        calendars.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return (monthOrder[a.month] || 13) - (monthOrder[b.month] || 13);
        });

        res.json(calendars);
    } catch (error) {
        console.error("Error fetching calendar:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all calendar entries {working}
export const getAllCalendar = async (req, res) => {
    try {
        const calendars = await prisma.calendar.findMany();

        const monthOrder = {
            January: 1, February: 2, March: 3, April: 4,
            May: 5, June: 6, July: 7, August: 8,
            September: 9, October: 10, November: 11, December: 12,
        };

        calendars.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return (monthOrder[a.month] || 13) - (monthOrder[b.month] || 13);
        });

        res.json(calendars);
    } catch (error) {
        console.error("Error fetching all calendar data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};