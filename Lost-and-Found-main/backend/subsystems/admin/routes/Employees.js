const express = require("express");
const Employee = require("../models/Employee");

const router = express.Router();

// ✅ CREATE employee
router.post("/", async (req, res) => {
  try {
    const employee = new Employee(req.body); // create new employee from request body
    await employee.save(); // save to database
    res.status(201).json(employee); // return saved employee
  } catch (err) {
    res.status(400).json({ message: err.message }); // validation or save error
  }
});

// ✅ READ → Get all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find(); // fetch all employees
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ → Get single employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id); // find by MongoDB _id
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE employee
router.put("/:id", async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // new:true → return updated record, runValidators:true → re-check schema rules
    );
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id); // delete employee
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
