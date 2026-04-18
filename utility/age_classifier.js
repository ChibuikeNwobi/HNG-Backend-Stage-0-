const ageClassifier = (age) => {
  if (age === null || age === undefined) {
    return null;
  }

  if (age >= 0 && age <= 12) return "child";
  else if (age >= 13 && age <= 19) return "teenager";
  else if (age >= 20 && age <= 59) return "adult";
  else if (age >= 60) return "senior";
  else return null;
};

module.exports = ageClassifier;
