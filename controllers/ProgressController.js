const {Progress}  = require('../models/Progresses');
const Lesson=require('../models/Lessons')
// Создать запись о прогрессе
const Course  = require('../models/Courses');

exports.createProgress = async (req, res) => {
  try {
    console.log('Create progresses started', req.body)
    const { status, completed_at, user_id, lesson_id} = req.body;

    const progress = await Progress.create({ status, completed_at, user_id, lesson_id });
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFinishedStatus = async (req, res) => {
  console.log('updateFinishedStatus userId= ',req.params.userId)
  const { userId } = req.params;
  const { isfinished } = req.body;

  try {
    // Обновляем все записи прогресса для пользователя
    const [updatedCount] = await Progress.update(
      { isfinished },
      {
        where: { user_id: userId },
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: "Прогресс для пользователя не найден" });
    }

    res.status(200).json({ message: "Статус теста обновлен" });
  } catch (error) {
    console.error("Ошибка при обновлении статуса теста:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.initialProgress=async(req,res)=>{
  console.log('0.1 Progress Initial started!')
    try {
      const { user_id, course_id } = req.body;
  
      console.log('1 user_id, course_id  ',user_id, course_id )
      // Проверяем, существует ли курс
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      // Создаем начальные записи о прогрессе
      await this.createInitialProgress(user_id, course_id);
  
      res.status(200).json({ message: 'User enrolled in the course successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  
}


exports.getAllProgressesWithCourseProgress = async (req, res) => {
  try {
    const { user_id, filters } = req.body;

    // Проверяем наличие user_id
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Находим все записи о прогрессе для пользователя
    const whereClause = { user_id };

    // Добавляем фильтры, если они указаны
    if (filters) {
      if (filters.course_ids && filters.course_ids.length > 0) {
        whereClause['$lesson.course_id$'] = filters.course_ids;
      }
      if (filters.statuses && filters.statuses.length > 0) {
        whereClause.status = filters.statuses;
      }
    }

    const progresses = await Progress.findAll({
      where: whereClause,
      include: [
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'course_id'],
        },
      ],
    });

    if (!progresses || progresses.length === 0) {
      return res.status(404).json({ error: 'No progress records found for this user' });
    }

    // Группируем прогресс по курсам
    const courseProgressMap = {};

    for (const progress of progresses) {
      const lesson = progress.lesson;
      const courseId = lesson.course_id;

      if (!courseProgressMap[courseId]) {
        courseProgressMap[courseId] = {
          course_id: courseId,
          completed_lessons: 0,
          total_lessons: 0,
          course_progress: 0,
          lessons: [],
        };
      }

      courseProgressMap[courseId].total_lessons += 1;

      if (progress.status === 'completed') {
        courseProgressMap[courseId].completed_lessons += 1;
      }

      courseProgressMap[courseId].lessons.push({
        lesson_id: lesson.id,
        title: lesson.title,
        status: progress.status,
        progress_percentage: progress.progress_percentage,
        completed_at: progress.completed_at,
      });
    }

    // Рассчитываем процент прогресса для каждого курса
    const result = [];
    for (const courseId in courseProgressMap) {
      const courseData = courseProgressMap[courseId];
      courseData.course_progress = (
        (courseData.completed_lessons / courseData.total_lessons) *
        100
      ).toFixed(2);

      const course = await Course.findByPk(courseId);
      courseData.course_name = course ? course.title : 'Unknown Course';

      result.push(courseData);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить все записи о прогрессе
exports.getAllProgresses = async (req, res) => {
  try {
    const progresses = await Progress.findAll();
    res.status(200).json(progresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Присвоить или обновить прогресс пользователя по уроку
// exports.assignProgress = async (req, res) => {
//   try {
//     const { user_id, lesson_id, status, progress_percentage } = req.body;

//     // Проверяем, существует ли запись о прогрессе для данного пользователя и урока
//     let progress = await Progress.findOne({
//       where: { user_id, lesson_id },
//     });

//     if (!progress) {
//       // Если записи нет, создаем новую
//       progress = await Progress.create({
//         user_id,
//         lesson_id,
//         status: status || 'not_started',
//         progress_percentage: progress_percentage || 0,
//       });
//       return res.status(201).json(progress);
//     }

//     // Обновляем существующую запись
//     progress.status = status || progress.status;
//     progress.progress_percentage = progress_percentage || progress.progress_percentage;

//     // Если статус "completed", автоматически устанавливаем прогресс в 100%
//     if (status === 'completed') {
//       progress.progress_percentage = 100;
//       progress.completed_at = new Date(); // Фиксируем дату завершения
//     }

//     await progress.save();

//     res.status(200).json(progress);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.createInitialProgress = async (userId, courseId) => {
  try {
    // Находим все уроки курса
    const lessons = await Lesson.findAll({ where: { course_id: courseId } });

    // Создаем записи о прогрессе для каждого урока
    for (const lesson of lessons) {
      await Progress.findOrCreate({
        where: { user_id: userId, lesson_id: lesson.id },
        defaults: {
          progress_percentage: 0,
          status: 'not_started',
        },
      });
    }
  } catch (error) {
    console.error('Error creating initial progress:', error.message);
  }
};

exports.updateLessonProgress = async (req, res) => {
  try {
    const { user_id, lesson_id, progress_percentage } = req.body;

    // Находим или создаем запись о прогрессе
    let progress = await Progress.findOne({
      where: { user_id, lesson_id },
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found' });
    }

    // Обновляем прогресс
    progress.progress_percentage = progress_percentage;
    progress.status =
      progress_percentage === 100 ? 'completed' : progress_percentage > 0 ? 'in_progress' : 'not_started';

    if (progress.status === 'completed') {
      progress.completed_at = new Date();
    }

    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const { user_id, course_id } = req.params;

    // Находим все уроки курса
    const lessons = await Lesson.findAll({ where: { course_id } });

    // Находим прогресс пользователя по каждому уроку
    const progresses = await Progress.findAll({
      where: {
        user_id,
        lesson_id: lessons.map((lesson) => lesson.id),
      },
    });

    // Рассчитываем общий прогресс курса
    const totalLessons = lessons.length;
    const completedLessons = progresses.filter((p) => p.status === 'completed').length;
    const courseProgressPercentage = ((completedLessons / totalLessons) * 100).toFixed(2);

    res.status(200).json({
      lessons: progresses,
      course_progress: courseProgressPercentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.assignProgress = async (req, res) => {
  try {
    const { user_id, lesson_id, progress_percentage } = req.body;

    // Находим урок
    const lesson = await Lesson.findByPk(lesson_id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Находим или создаем запись о прогрессе
    let progress = await Progress.findOne({
      where: { user_id, lesson_id },
    });

    if (!progress) {
      progress = await Progress.create({
        user_id,
        lesson_id,
        progress_percentage: 0,
        status: 'not_started',
      });
    }

    // Обновляем прогресс
    progress.progress_percentage = progress_percentage || progress.progress_percentage;
    progress.status =
      progress_percentage === 100 ? 'completed' : progress_percentage > 0 ? 'in_progress' : 'not_started';

    if (progress.status === 'completed') {
      progress.completed_at = new Date();
    }

    await progress.save();

    // Рассчитываем общий прогресс курса
    const courseId = lesson.course_id;
    const allLessons = await Lesson.findAll({ where: { course_id: courseId } });
    const totalLessons = allLessons.length;

    const completedLessons = await Progress.count({
      where: {
        user_id,
        lesson_id: allLessons.map((lesson) => lesson.id),
        status: 'completed',
      },
    });

    const courseProgressPercentage = ((completedLessons / totalLessons) * 100).toFixed(2);

    res.status(200).json({
      lesson_progress: progress,
      course_progress: courseProgressPercentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Получить запись о прогрессе по ID
exports.getProgressById = async (req, res) => {
  try {
    const progress = await Progress.findByPk(req.params.id);
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// exports.getProgressByUserId = async (req, res) => {
//   try {
//     const progress = await Progress.findByPk(req.params.id);
//     if (!progress) {
//       return res.status(404).json({ error: 'Progress not found' });
//     }
//     res.status(200).json(progress);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// Обновить запись о прогрессе
exports.updateProgress = async (req, res) => {
  try {
    const { status, completed_at, userId, lessonId } = req.body;
    const [updated] = await Progress.update(
      { status, completed_at, userId, lessonId },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedProgress = await Progress.findByPk(req.params.id);
      return res.status(200).json(updatedProgress);
    }
    res.status(404).json({ error: 'Progress not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить запись о прогрессе
exports.deleteProgress = async (req, res) => {
  try {
    const deleted = await Progress.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      return res.status(204).send();
    }
    res.status(404).json({ error: 'Progress not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};