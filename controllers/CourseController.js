

const Course  = require('../models/Courses');

// Создать курс
// exports.createCourse = async (req, res) => {
//   console.log('1 createCourse started')
//   try {
//     const { title, description } = req.body;
//     console.log('2 req.body ',req.body)
//     const course = await Course.create({ title, description });
//     console.log('3 course=  ',course)
//     res.status(201).json(course);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


exports.createCourse = async (req, res) => {
    console.log('1 createCourse started');
  try {
    const { title, description } = req.body;
    console.log('2 req.body:', req.body);

    const course = await Course.create({ title, description });
    console.log('3 course created:', course);

    res.status(201).json(course);
    
  } catch (error) {
    console.error('4 Error creating course:', error.message); // Логируем ошибку
    res.status(500).json({ error: error.message });
  }
};


// Получить все курсы
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить курс по ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить курс
exports.updateCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const [updated] = await Course.update(
      { title, description },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedCourse = await Course.findByPk(req.params.id);
      return res.status(200).json(updatedCourse);
    }
    res.status(404).json({ error: 'Course not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить курс
exports.deleteCourse = async (req, res) => {
  try {
    const deleted = await Course.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      return res.status(204).send();
    }
    res.status(404).json({ error: 'Course not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};