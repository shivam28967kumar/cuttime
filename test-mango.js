const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://shivam28967:<shivam2867aa>@cluster0.uonh1q7.mongodb.net/cuttime?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
