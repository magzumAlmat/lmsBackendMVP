const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/files/');
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.split('.')
        ext = ext[ext.length - 1];
        const filename =   Date.now() + "." + ext
        cb(null, filename)
    }
})

const upload = multer({storage})

module.exports = {
    upload
}


// const multer = require('multer');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/banners/');
//     },
//     filename: function (req, file, cb) {
//         let ext = file.originalname.split('.');
//         ext = ext[ext.length - 1];
//         const filename = Date.now() + '.' + ext;
//         cb(null, filename);
//     },
// });

// const upload = multer({ storage }).array('imageUrl', 20);

// module.exports = {
//     upload,
// };