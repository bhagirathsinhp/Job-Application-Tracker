// Job Application Tracker JavaScript

// Application data - starts empty, loads from localStorage if available
let sampleData = [];

// Data persistence functions
function saveData() {
  try {
    localStorage.setItem("job-applications-data", JSON.stringify(sampleData));
  } catch (error) {
    console.error("Error saving data:", error);
    alert(
      "Warning: Your data could not be saved. Please export your data as backup."
    );
  }
}

function loadData() {
  try {
    const savedData = localStorage.getItem("job-applications-data");
    if (savedData) {
      sampleData = JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Warning: Could not load saved data. Starting with empty tracker.");
    sampleData = [];
  }
}

// Initialize table
function initializeTable() {
  // Load data from localStorage first
  loadData();

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  sampleData.forEach((item, index) => {
    addRowToTable(item, index);
  });

  updateStats();
}

// Add row to table
function addRowToTable(data, index) {
  const tbody = document.getElementById("tableBody");
  const row = document.createElement("tr");
  row.setAttribute("data-index", index);

  const followUpDate = data.followUp
    ? new Date(data.followUp).toLocaleDateString("en-GB")
    : "";
  const applicationDate = new Date(data.date).toLocaleDateString("en-GB");

  row.innerHTML = `
        <td class="checkbox-col">
            <input type="checkbox" class="row-checkbox" data-index="${index}" onchange="toggleRowSelection(${index})">
        </td>
        <td class="company-name">${data.company}</td>
        <td class="position-title">${data.position}</td>
        <td>${applicationDate}</td>
        <td>${data.method}</td>
        <td><span class="status status-${data.status
          .toLowerCase()
          .replace(/\s+/g, "-")}">${data.status}</span></td>
        <td>${followUpDate}</td>
        <td class="salary">${data.salary}</td>
        <td class="visa-${data.visa.toLowerCase()}">${data.visa}</td>
        <td>${data.recruiter}</td>
        <td class="notes">${data.notes}</td>
        <td>
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="editRow(${index})">Edit</button>
            <button class="btn" style="padding: 4px 8px; font-size: 11px; background: #e53e3e;" onclick="deleteRow(${index})">Delete</button>
        </td>
    `;

  tbody.appendChild(row);
}

// Toggle add form
function toggleAddForm() {
  const form = document.getElementById("addRowForm");
  form.style.display =
    form.style.display === "none" || form.style.display === ""
      ? "block"
      : "none";

  if (form.style.display === "block") {
    document.getElementById("newDate").value = new Date()
      .toISOString()
      .split("T")[0];
  }
}

// Handle application method change
function handleMethodChange() {
  const methodSelect = document.getElementById("newMethod");
  const customMethodInput = document.getElementById("customMethod");

  if (methodSelect.value === "Other") {
    customMethodInput.style.display = "block";
    customMethodInput.focus();
    customMethodInput.required = true;
  } else {
    customMethodInput.style.display = "none";
    customMethodInput.value = "";
    customMethodInput.required = false;
  }
}

// Handle edit method change
function handleEditMethodChange() {
  const methodSelect = document.getElementById("editMethod");
  const customMethodInput = document.getElementById("editCustomMethod");

  if (methodSelect.value === "Other") {
    customMethodInput.style.display = "block";
    customMethodInput.focus();
    customMethodInput.required = true;
  } else {
    customMethodInput.style.display = "none";
    customMethodInput.value = "";
    customMethodInput.required = false;
  }
}

// Add new application
async function addNewRow() {
  const company = document.getElementById("newCompany").value;
  const position = document.getElementById("newPosition").value;
  const methodSelect = document.getElementById("newMethod");
  const customMethod = document.getElementById("customMethod").value;

  if (!company || !position) {
    alert("Please fill in company name and position title.");
    return;
  }

  // Check if "Other" is selected but no custom method is provided
  if (methodSelect.value === "Other" && !customMethod.trim()) {
    alert("Please specify the application method.");
    document.getElementById("customMethod").focus();
    return;
  }

  // Use custom method if "Other" is selected, otherwise use the selected value
  const applicationMethod =
    methodSelect.value === "Other" ? customMethod.trim() : methodSelect.value;

  const newData = {
    id: sampleData.length, // Add unique ID
    company: company,
    position: position,
    date:
      document.getElementById("newDate").value ||
      new Date().toISOString().split("T")[0],
    method: applicationMethod,
    status: document.getElementById("newStatus").value,
    followUp: document.getElementById("newFollowUp").value || "",
    salary: document.getElementById("newSalary").value,
    visa: document.getElementById("newVisa").value,
    recruiter: document.getElementById("newRecruiter").value,
    notes: document.getElementById("newNotes").value,
  };

  try {
    // Add the new application to the database
    await jobDB.addApplication(newData);

    // Update the table with the new application
    addRowToTable(newData, sampleData.length - 1);

    // Clear the form and hide it
    toggleAddForm();
    clearForm();

    alert("Application added successfully!");
  } catch (error) {
    console.error("Failed to add application:", error);
    alert("Failed to add application. Please try again.");
  }
}

// Clear form function
function clearForm() {
  document
    .getElementById("addRowForm")
    .querySelectorAll("input, select")
    .forEach((input) => {
      if (input.type !== "date") input.value = "";
    });

  document.getElementById("newMethod").value = "Company Website";
  document.getElementById("newStatus").value = "Applied";
  document.getElementById("newVisa").value = "Unknown";

  // Hide custom method input after clearing
  document.getElementById("customMethod").style.display = "none";
  document.getElementById("customMethod").required = false;
}

// Edit application function
async function editApplication(id) {
  const application = sampleData.find((app, index) => index === id);
  if (!application) {
    alert("Application not found.");
    return;
  }

  // Show edit form
  showEditForm(application);
}

// Show edit form
function showEditForm(application) {
  // Create edit form HTML
  const editFormHTML = `
        <div class="edit-form-overlay" id="editFormOverlay">
            <div class="edit-form-modal">
                <div class="edit-form-header">
                    <h3>Edit Application</h3>
                    <button class="btn btn-secondary" onclick="closeEditForm()">×</button>
                </div>
                <div class="edit-form-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Company Name *</label>
                            <input type="text" id="editCompany" value="${
                              application.company
                            }" required>
                        </div>
                        <div class="form-group">
                            <label>Position Title *</label>
                            <input type="text" id="editPosition" value="${
                              application.position
                            }" required>
                        </div>
                        <div class="form-group">
                            <label>Application Date</label>
                            <input type="date" id="editDate" value="${
                              application.date
                            }">
                        </div>
                        <div class="form-group">
                            <label>Application Method</label>
                            <select id="editMethod" onchange="handleEditMethodChange()">
                                <option value="Company Website" ${
                                  application.method === "Company Website"
                                    ? "selected"
                                    : ""
                                }>Company Website</option>
                                <option value="LinkedIn" ${
                                  application.method === "LinkedIn"
                                    ? "selected"
                                    : ""
                                }>LinkedIn</option>
                                <option value="Indeed" ${
                                  application.method === "Indeed"
                                    ? "selected"
                                    : ""
                                }>Indeed</option>
                                <option value="Reed" ${
                                  application.method === "Reed"
                                    ? "selected"
                                    : ""
                                }>Reed</option>
                                <option value="Glassdoor" ${
                                  application.method === "Glassdoor"
                                    ? "selected"
                                    : ""
                                }>Glassdoor</option>
                                <option value="Referral" ${
                                  application.method === "Referral"
                                    ? "selected"
                                    : ""
                                }>Referral</option>
                                <option value="University" ${
                                  application.method === "University"
                                    ? "selected"
                                    : ""
                                }>University Career Service</option>
                                <option value="Other" ${
                                  ![
                                    "Company Website",
                                    "LinkedIn",
                                    "Indeed",
                                    "Reed",
                                    "Glassdoor",
                                    "Referral",
                                    "University",
                                  ].includes(application.method)
                                    ? "selected"
                                    : ""
                                }>Other</option>
                            </select>
                            <input type="text" id="editCustomMethod" placeholder="Please specify..." style="display: ${
                              ![
                                "Company Website",
                                "LinkedIn",
                                "Indeed",
                                "Reed",
                                "Glassdoor",
                                "Referral",
                                "University",
                              ].includes(application.method)
                                ? "block"
                                : "none"
                            }; margin-top: 5px;" value="${
    ![
      "Company Website",
      "LinkedIn",
      "Indeed",
      "Reed",
      "Glassdoor",
      "Referral",
      "University",
    ].includes(application.method)
      ? application.method
      : ""
  }">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="editStatus">
                                <option value="Applied" ${
                                  application.status === "Applied"
                                    ? "selected"
                                    : ""
                                }>Applied</option>
                                <option value="Acknowledged" ${
                                  application.status === "Acknowledged"
                                    ? "selected"
                                    : ""
                                }>Acknowledged</option>
                                <option value="Phone Screen" ${
                                  application.status === "Phone Screen"
                                    ? "selected"
                                    : ""
                                }>Phone Screen</option>
                                <option value="Technical Assessment" ${
                                  application.status === "Technical Assessment"
                                    ? "selected"
                                    : ""
                                }>Technical Assessment</option>
                                <option value="Interview" ${
                                  application.status === "Interview"
                                    ? "selected"
                                    : ""
                                }>Interview</option>
                                <option value="Final Stage" ${
                                  application.status === "Final Stage"
                                    ? "selected"
                                    : ""
                                }>Final Stage</option>
                                <option value="Offer" ${
                                  application.status === "Offer"
                                    ? "selected"
                                    : ""
                                }>Offer</option>
                                <option value="Rejected" ${
                                  application.status === "Rejected"
                                    ? "selected"
                                    : ""
                                }>Rejected</option>
                                <option value="Withdrawn" ${
                                  application.status === "Withdrawn"
                                    ? "selected"
                                    : ""
                                }>Withdrawn</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Follow-up Date</label>
                            <input type="date" id="editFollowUp" value="${
                              application.followUp || ""
                            }">
                        </div>
                        <div class="form-group">
                            <label>Salary Range</label>
                            <input type="text" id="editSalary" placeholder="e.g., £30,000-£35,000" value="${
                              application.salary || ""
                            }">
                        </div>
                        <div class="form-group">
                            <label>Visa Sponsorship</label>
                            <select id="editVisa">
                                <option value="Unknown" ${
                                  application.visa === "Unknown"
                                    ? "selected"
                                    : ""
                                }>Unknown</option>
                                <option value="Yes" ${
                                  application.visa === "Yes" ? "selected" : ""
                                }>Yes</option>
                                <option value="No" ${
                                  application.visa === "No" ? "selected" : ""
                                }>No</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Recruiter Contact</label>
                            <input type="text" id="editRecruiter" placeholder="Name & Email" value="${
                              application.recruiter || ""
                            }">
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="editNotes" placeholder="Additional information" rows="3">${
                              application.notes || ""
                            }</textarea>
                        </div>
                    </div>
                    <div class="edit-form-buttons">
                        <button class="btn" onclick="saveEditedApplication(${
                          application.id
                        })">Save Changes</button>
                        <button class="btn btn-secondary" onclick="closeEditForm()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add edit form to page
  document.body.insertAdjacentHTML("beforeend", editFormHTML);
}

// Save edited application
async function saveEditedApplication(id) {
  const company = document.getElementById("editCompany").value;
  const position = document.getElementById("editPosition").value;
  const methodSelect = document.getElementById("editMethod");
  const customMethod = document.getElementById("editCustomMethod").value;

  if (!company || !position) {
    alert("Please fill in company name and position title.");
    return;
  }

  // Check if "Other" is selected but no custom method is provided
  if (methodSelect.value === "Other" && !customMethod.trim()) {
    alert("Please specify the application method.");
    document.getElementById("editCustomMethod").focus();
    return;
  }

  // Use custom method if "Other" is selected, otherwise use the selected value
  const applicationMethod =
    methodSelect.value === "Other" ? customMethod.trim() : methodSelect.value;

  const updatedData = {
    company: company,
    position: position,
    date: document.getElementById("editDate").value,
    method: applicationMethod,
    status: document.getElementById("editStatus").value,
    followUp: document.getElementById("editFollowUp").value,
    salary: document.getElementById("editSalary").value,
    visa: document.getElementById("editVisa").value,
    recruiter: document.getElementById("editRecruiter").value,
    notes: document.getElementById("editNotes").value,
  };

  try {
    await jobDB.updateApplication(id, updatedData);
    await loadAllApplications();
    closeEditForm();
    alert("Application updated successfully!");
  } catch (error) {
    console.error("Failed to update application:", error);
    alert("Failed to update application. Please try again.");
  }
}

// Close edit form
function closeEditForm() {
  const overlay = document.getElementById("editFormOverlay");
  if (overlay) {
    overlay.remove();
  }
}

// Delete application
async function deleteApplication(id) {
  if (id >= 0 && id < sampleData.length) {
    try {
      sampleData.splice(id, 1); // Remove the application from sampleData
      saveData(); // Save the updated data to localStorage
      loadAllApplications(); // Reload the table
      alert("Application deleted successfully!");
    } catch (error) {
      console.error("Failed to delete application:", error);
      alert("Failed to delete application. Please try again.");
    }
  } else {
    alert("Invalid application ID. Unable to delete.");
  }
}

// Update statistics
function updateStats() {
  const total = sampleData.length;
  const pending = sampleData.filter(
    (item) => !["Rejected", "Withdrawn", "Offer"].includes(item.status)
  ).length;
  const interviews = sampleData.filter((item) =>
    [
      "Phone Screen",
      "Technical Assessment",
      "Interview",
      "Final Stage",
    ].includes(item.status)
  ).length;
  const offers = sampleData.filter((item) => item.status === "Offer").length;
  const responses = sampleData.filter(
    (item) => item.status !== "Applied"
  ).length;
  const responseRate = total > 0 ? Math.round((responses / total) * 100) : 0;

  document.getElementById("total-apps").textContent = total;
  document.getElementById("pending-apps").textContent = pending;
  document.getElementById("interview-apps").textContent = interviews;
  document.getElementById("offer-apps").textContent = offers;
  document.getElementById("success-rate").textContent = responseRate + "%";
}

// Filter table
function filterTable() {
  const statusFilter = document.getElementById("statusFilter").value;
  const visaFilter = document.getElementById("visaFilter").value;
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const status = row.querySelector(".status").textContent;
    const visa = row.cells[8].textContent; // Updated index for visa column

    const statusMatch = !statusFilter || status === statusFilter;
    const visaMatch = !visaFilter || visa === visaFilter;

    row.style.display = statusMatch && visaMatch ? "" : "none";
  });
}

// Search table
function searchTable() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach((row) => {
    const company = row.cells[1].textContent.toLowerCase(); // Updated index for company column
    const position = row.cells[2].textContent.toLowerCase(); // Updated index for position column
    const notes = row.cells[10].textContent.toLowerCase(); // Updated index for notes column

    const matches =
      company.includes(search) ||
      position.includes(search) ||
      notes.includes(search);
    row.style.display = matches ? "" : "none";
  });
}

// Export to CSV
function exportData() {
  const headers = [
    "Company",
    "Position",
    "Applied Date",
    "Method",
    "Status",
    "Follow-up",
    "Salary",
    "Visa",
    "Recruiter",
    "Notes",
  ];
  const csvContent = [
    headers.join(","),
    ...sampleData.map((row) =>
      [
        `"${row.company}"`,
        `"${row.position}"`,
        row.date,
        `"${row.method}"`,
        `"${row.status}"`,
        row.followUp || "",
        `"${row.salary}"`,
        row.visa,
        `"${row.recruiter}"`,
        `"${row.notes.replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job_applications_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Edit row
function editRow(index) {
  editApplication(index); // Call the editApplication function
}

// Delete row
function deleteRow(index) {
  if (confirm("Are you sure you want to delete this application?")) {
    deleteApplication(index); // Pass the correct index to deleteApplication
  }
}

// Toggle select all checkbox
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById("selectAll");
  const rowCheckboxes = document.querySelectorAll(".row-checkbox");
  const isChecked = selectAllCheckbox.checked;

  rowCheckboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
    const rowIndex = parseInt(checkbox.getAttribute("data-index"));
    toggleRowSelection(rowIndex, false);
  });

  updateBulkActions();
}

// Toggle row selection
function toggleRowSelection(index, updateSelectAll = true) {
  const checkbox = document.querySelector(
    `.row-checkbox[data-index="${index}"]`
  );
  const row = document.querySelector(`tr[data-index="${index}"]`);

  if (checkbox && row) {
    if (checkbox.checked) {
      row.classList.add("row-selected");
    } else {
      row.classList.remove("row-selected");
    }

    if (updateSelectAll) {
      updateSelectAllCheckbox();
    }

    updateBulkActions();
  }
}

// Update select all checkbox based on individual selections
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAll");
  const rowCheckboxes = document.querySelectorAll(".row-checkbox");
  const checkedBoxes = document.querySelectorAll(".row-checkbox:checked");

  if (checkedBoxes.length === 0) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  } else if (checkedBoxes.length === rowCheckboxes.length) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = true;
  } else {
    selectAllCheckbox.indeterminate = true;
    selectAllCheckbox.checked = false;
  }
}

// Update bulk actions visibility and count
function updateBulkActions() {
  const checkedBoxes = document.querySelectorAll(".row-checkbox:checked");
  const bulkActions = document.getElementById("bulkActions");
  const selectedCount = document.getElementById("selectedCount");

  if (checkedBoxes.length > 0) {
    bulkActions.classList.add("show");
    selectedCount.textContent = `${checkedBoxes.length} item${
      checkedBoxes.length === 1 ? "" : "s"
    } selected`;
  } else {
    bulkActions.classList.remove("show");
  }
}

// Delete selected rows
async function deleteSelected() {
  const checkedBoxes = document.querySelectorAll(".row-checkbox:checked");
  const selectedIds = Array.from(checkedBoxes).map((cb) =>
    parseInt(cb.getAttribute("data-id"))
  );

  if (selectedIds.length === 0) {
    alert("Please select items to delete.");
    return;
  }

  const confirmMessage = `Are you sure you want to delete ${
    selectedIds.length
  } selected application${selectedIds.length === 1 ? "" : "s"}?`;

  if (confirm(confirmMessage)) {
    try {
      await jobDB.deleteMultipleApplications(selectedIds);
      await loadAllApplications();
      clearSelection();
      alert(
        `${selectedIds.length} application${
          selectedIds.length === 1 ? "" : "s"
        } deleted successfully!`
      );
    } catch (error) {
      console.error("Failed to delete selected applications:", error);
      alert("Failed to delete selected applications. Please try again.");
    }
  }
}

// Clear all selections
function clearSelection() {
  const selectAllCheckbox = document.getElementById("selectAll");
  const rowCheckboxes = document.querySelectorAll(".row-checkbox");
  const selectedRows = document.querySelectorAll(".row-selected");

  selectAllCheckbox.checked = false;
  selectAllCheckbox.indeterminate = false;

  rowCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  selectedRows.forEach((row) => {
    row.classList.remove("row-selected");
  });

  updateBulkActions();
}

// Clear all data function
async function clearAllData() {
  const confirmMessage =
    "Are you sure you want to clear ALL application data? This action cannot be undone.\n\nTip: Consider exporting your data first as a backup.";

  if (confirm(confirmMessage)) {
    try {
      await jobDB.clearAllApplications();
      applicationData = [];
      renderTable();
      alert("All application data has been cleared.");
    } catch (error) {
      console.error("Failed to clear all data:", error);
      alert("Failed to clear all data. Please try again.");
    }
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", function () {
  initializeDatabase();
  initializeTheme();
  initializeTable();
});

// Theme Management
function initializeTheme() {
  const themeSwitch = document.getElementById("theme-switch");
  const savedTheme = localStorage.getItem("job-tracker-theme") || "light";

  // Apply saved theme
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeSwitch.checked = savedTheme === "dark";

  // Add event listener for theme toggle
  themeSwitch.addEventListener("change", function () {
    const newTheme = this.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("job-tracker-theme", newTheme);

    // Update theme label
    const themeLabel = document.querySelector(".theme-label");
    themeLabel.textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
  });

  // Set initial label
  const themeLabel = document.querySelector(".theme-label");
  themeLabel.textContent = savedTheme === "dark" ? "Light Mode" : "Dark Mode";
}

// Database simulation (for demo purposes)
const jobDB = {
  addApplication: async (data) => {
    sampleData.push(data);
    saveData();
  },
  updateApplication: async (id, updatedData) => {
    sampleData[id] = { ...sampleData[id], ...updatedData };
    saveData();
  },
  deleteApplication: async (id) => {
    sampleData.splice(id, 1);
    saveData();
  },
  deleteMultipleApplications: async (ids) => {
    ids.sort((a, b) => b - a); // Sort in descending order to avoid index shifting
    ids.forEach((id) => sampleData.splice(id, 1));
    saveData();
  },
  clearAllApplications: async () => {
    sampleData = [];
    saveData();
  },
};

async function loadAllApplications() {
  initializeTable();
}

// filepath: e:\Job Application Tracker\main.js
function initializeDatabase() {
  loadData();
}
