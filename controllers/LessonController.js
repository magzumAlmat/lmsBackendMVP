// const Lesson = require('../models/Lessons');
// const User = require('../auth/models/User'); // Импортируем модель User
// const { Progress } = require('../models/Progresses');

// // Создать урок
// exports.createLesson = async (req, res) => {
//   console.log('Create Lesson started!', req.body);
//   try {
//     const { title, content, course_id, isReviewLesson = false } = req.body;
//     const lesson = await Lesson.create({ title, content, course_id, isReviewLesson });
//     console.log('this is lesson- ', lesson);
//     res.status(201).json(lesson);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Получить все уроки
// exports.getAllLessons = async (req, res) => {
//   try {
//     const lessons = await Lesson.findAll();
//     res.status(200).json(lessons);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Получить урок по ID
// exports.getLessonById = async (req, res) => {
//   try {
//     const lesson = await Lesson.findByPk(req.params.id);
//     if (!lesson) {
//       return res.status(404).json({ error: 'Lesson not found' });
//     }
//     res.status(200).json(lesson);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Обновить урок
// exports.updateLesson = async (req, res) => {
//   try {
//     const { title, content, courseId, isReviewLesson } = req.body;
//     const [updated] = await Lesson.update(
//       { title, content, courseId, isReviewLesson },
//       { where: { id: req.params.id } }
//     );
//     if (updated) {
//       const updatedLesson = await Lesson.findByPk(req.params.id);
//       return res.status(200).json(updatedLesson);
//     }
//     res.status(404).json({ error: 'Lesson not found' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Удалить урок
// exports.deleteLesson = async (req, res) => {
//   try {
//     const id = req.params.id;
//     console.log('lessonId= ', id);

//     const lesson = await Lesson.findByPk(id);
//     if (!lesson) {
//       return res.status(404).json({ error: 'Lesson not found' });
//     }

//     await Progress.destroy({ where: { lesson_id: id } });
//     const deleted = await Lesson.destroy({ where: { id: id } });

//     if (deleted) {
//       return res.status(204).send();
//     }
//     res.status(404).json({ error: 'Lesson not found' });
//   } catch (error) {
//     console.error('Ошибка при удалении урока:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Новый метод: отправка отзыва
// exports.submitReview = async (req, res) => {
//   try {
//     const { userId, lessonId, review } = req.body;

//     // Проверяем, существует ли урок и является ли он уроком для отзыва
//     const lesson = await Lesson.findByPk(lessonId);
//     if (!lesson) {
//       return res.status(404).json({ error: 'Lesson not found' });
//     }
//     if (!lesson.isReviewLesson) {
//       return res.status(400).json({ error: 'This lesson is not designated for reviews' });
//     }

//     // Обновляем поле review в таблице users
//     const [updated] = await User.update(
//       { review },
//       { where: { id: userId } }
//     );

//     if (updated) {
//       const updatedUser = await User.findByPk(userId);
//       return res.status(200).json({ message: 'Review submitted successfully', user: updatedUser });
//     }
//     res.status(404).json({ error: 'User not found' });
//   } catch (error) {
//     console.error('Ошибка при отправке отзыва:', error);
//     res.status(500).json({ error: error.message });
//   }
// };



const Lesson = require('../models/Lessons');
const User = require('../auth/models/User');
const { Progress } = require('../models/Progresses');

// Создать урок
exports.createLesson = async (req, res) => {
  console.log('Create Lesson started!', req.body);
  try {
    const { title, content, course_id, isReviewLesson = false, priority_config } = req.body;

    // Валидация priority_config, если предоставлен
    if (priority_config) {
      const validKeys = ['EditorJS', 'Video', 'AdditionalMaterials'];
      const isValid = validKeys.every(key => typeof priority_config[key] === 'number' && priority_config[key] > 0);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid priority_config format' });
      }
    }

    const lesson = await Lesson.create({
      title,
      content,
      course_id,
      isReviewLesson,
      priority_config: priority_config || { EditorJS: 1, Video: 2, AdditionalMaterials: 3 },
    });
    console.log('this is lesson- ', lesson);
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить все уроки
exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.findAll();
    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить урок по ID
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить урок
exports.updateLesson = async (req, res) => {
  try {
    const { title, content, course_id, isReviewLesson, priority_config } = req.body;

    // Валидация priority_config, если предоставлен
    if (priority_config) {
      const validKeys = ['EditorJS', 'Video', 'AdditionalMaterials'];
      const isValid = validKeys.every(key => typeof priority_config[key] === 'number' && priority_config[key] > 0);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid priority_config format' });
      }
    }

    const [updated] = await Lesson.update(
      { title, content, course_id, isReviewLesson, priority_config },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedLesson = await Lesson.findByPk(req.params.id);
      return res.status(200).json(updatedLesson);
    }
    res.status(404).json({ error: 'Lesson not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить урок
exports.deleteLesson = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('lessonId= ', id);

    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await Progress.destroy({ where: { lesson_id: id } });
    const deleted = await Lesson.destroy({ where: { id: id } });

    if (deleted) {
      return res.status(204).send();
    }
    res.status(404).json({ error: 'Lesson not found' });
  } catch (error) {
    console.error('Ошибка при удалении урока:', error);
    res.status(500).json({ error: error.message });
  }
};

// Новый метод: отправка отзыва
exports.submitReview = async (req, res) => {
  try {
    const { userId, lessonId, review } = req.body;

    // Проверяем, существует ли урок и является ли он уроком для отзыва
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    if (!lesson.isReviewLesson) {
      return res.status(400).json({ error: 'This lesson is not designated for reviews' });
    }

    // Обновляем поле review в таблице users
    const [updated] = await User.update(
      { review },
      { where: { id: userId } }
    );

    if (updated) {
      const updatedUser = await User.findByPk(userId);
      return res.status(200).json({ message: 'Review submitted successfully', user: updatedUser });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error('Ошибка при отправке отзыва:', error);
    res.status(500).json({ error: error.message });
  }
};

// Новый метод: установить приоритеты для урока (POST)
exports.setLessonPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority_config } = req.body;

    // Валидация priority_config
    const validKeys = ['EditorJS', 'Video', 'AdditionalMaterials'];
    const isValid = priority_config && validKeys.every(key => typeof priority_config[key] === 'number' && priority_config[key] > 0);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid priority_config format' });
    }

    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await Lesson.update(
      { priority_config },
      { where: { id } }
    );

    const updatedLesson = await Lesson.findByPk(id);
    res.status(200).json({ message: 'Priority config updated successfully', lesson: updatedLesson });
  } catch (error) {
    console.error('Ошибка при установке приоритетов:', error);
    res.status(500).json({ error: error.message });
  }
};

// Новый метод: получить приоритеты для урока (GET)
exports.getLessonPriority = async (req, res) => {
  console.log("Вывожу приоритеты")
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByPk(id, {
      attributes: ['id', 'title', 'priority_config'],
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.status(200).json({ priority_config: lesson.priority_config });
  } catch (error) {
    console.error('Ошибка при получении приоритетов:', error);
    res.status(500).json({ error: error.message });
  }
};