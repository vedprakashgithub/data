const express = require("express");
const router = express.Router();

const { supabase } = require("../lib");

router.post("/free-enrollment", async (req, res) => {
  try {
    const { courseId, batchId, studentId } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        error: "studentId is required",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        error: "courseId is required",
      });
    }

    if (batchId) {
      // Check if already enrolled in batch
      const { data: existing, error: checkError } = await supabase
        .from("batch_enrollments")
        .select("id")
        .eq("batch_id", batchId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existing) {
        const { error } = await supabase
          .from("batch_enrollments")
          .insert({
            batch_id: batchId,
            student_id: studentId,
            course_id: courseId,
            status: "active",
          });

        if (error) throw error;
      }
    } else {
      // Check if already enrolled in course
      const { data: existing, error: checkError } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existing) {
        const { error } = await supabase
          .from("course_enrollments")
          .insert({
            course_id: courseId,
            student_id: studentId,
            status: "active",
          });

        if (error) throw error;
      }
    }

    res.status(200).json({
      success: true,
      message: "Free enrollment completed",
    });
  } catch (err) {
    console.error("Free Enrollment Error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;