const ageClassifier = (age) => {
  console.log("age -> ", age);

  if (age <= 12) return "child";
  else if (age >= 13 && age <= 19) return "teenager";
  else if (age >= 20 && age <= 59) return "adult";
  else if (age >= 60) return "senior";
  else return "unknown age group";
};

module.exports = ageClassifier;
