function skillsMember() {
    this.skills = ["JavaScript", "React", "React Native"];
    this.addSkill = function (newSkill) {
        this.skills.push(newSkill);
    };
}