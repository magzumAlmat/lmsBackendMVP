const { Exercise } = require('../models/Exercises');

// Создать упражнение
exports.createExercise = async (req, res) => {
  try {
    const { title, description, lessonId } = req.body;
    const exercise = await Exercise.create({ title, description, lessonId });
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить все упражнения
exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    res.status(200).json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить упражнение по ID
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.status(200).json(exercise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить упражнение
exports.updateExercise = async (req, res) => {
  try {
    const { title, description, lessonId } = req.body;
    const [updated] = await Exercise.update(
      { title, description, lessonId },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedExercise = await Exercise.findByPk(req.params.id);
      return res.status(200).json(updatedExercise);
    }
    res.status(404).json({ error: 'Exercise not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить упражнение
exports.deleteExercise = async (req, res) => {
  try {
    const deleted = await Exercise.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      return res.status(204).send();
    }
    res.status(404).json({ error: 'Exercise not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};