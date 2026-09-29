
# 🌊 PranRaksha – AI-Powered Emergency Response Intelligence Platform

## 1. Introduction

PranRaksha is an AI-powered disaster management and emergency response platform designed to support authorities and relief teams during critical situations.

The platform combines disaster risk assessment, resource management, infrastructure analysis, disaster reporting, machine-learning models, and interactive visualizations to support data-driven emergency response.

---

## 2. Problem Statement

During disasters, authorities may face difficulties in:

- Identifying high-risk areas
- Assessing disaster severity
- Determining required resources
- Locating nearby warehouses
- Identifying resource shortages
- Coordinating emergency response
- Accessing disaster information in an organized manner

PranRaksha brings these activities together in a single platform.

---

## 3. Objectives

- AI-powered disaster risk assessment
- Disaster-affected area analysis
- Resource requirement calculation
- Nearest warehouse identification
- Resource shortage analysis
- Disaster reporting and history
- Interactive disaster visualization
- Multilingual emergency support
- Machine-learning model comparison

---

## 4. Key Features

### 🗺️ Interactive Disaster Visualization

- Interactive visualization of disaster-affected areas
- 3D geographical visualization
- Disaster location visualization
- Risk and analytical information

### ⚠️ Risk & Severity Assessment

- AI-powered disaster risk assessment
- Disaster severity analysis
- Potential impact assessment
- Geographical and environmental analysis

### 📦 Resource Management

- Resource requirement calculation
- Warehouse resource availability
- Nearest warehouse identification
- Resource shortage analysis
- Resource allocation support

### 🚨 Disaster Reporting & History

- Report new disasters
- View reported disasters
- Maintain disaster history
- Historical disaster analysis

### 🌐 Multilingual Support

- Multilingual emergency support
- Improved accessibility across different regions

### 🤖 Machine Learning

- Model training
- Model evaluation
- Model comparison
- Prediction
- Result analysis

---

## 5. How Disaster Risk Assessment Works

The platform analyzes disaster and geographical information such as:

- Rainfall
- Wind speed
- Humidity
- Population
- Infrastructure availability
- Road accessibility
- Geographic location

This information is processed to generate disaster risk insights and support emergency response planning.

---

## 6. Resource Allocation

When a disaster area is identified:

1. Analyze the affected population.
2. Calculate required resources.
3. Check warehouse availability.
4. Identify a nearby suitable warehouse.
5. Compare required and available resources.
6. Identify resource shortages.

Resources include:

- Food packets
- Water bottles
- Medical kits
- Blankets

---

## 7. Disaster Reporting & History

Users can:

- Select a disaster location
- Provide geographical coordinates
- Record disaster information
- Perform risk assessment
- View reported disasters
- Maintain disaster history

---

## 8. Technology Stack

### Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- Base UI
- Three.js
- React Three Fiber
- Recharts
- Lucide React

### Backend

- Python
- FastAPI

### Machine Learning & Data Processing

- Python
- Scikit-learn
- Pandas
- NumPy
- Jupyter Notebook

### Package Manager

- pnpm

---

## 9. Project Structure

```text
PranRaksha/
│
├── Dataset/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── model training.ipynb
│   ├── model_comparison_results.csv
│   ├── resource allocation.ipynb
│   └── warehouse_inventory.csv
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   └── scripts/
│
└── README.md
````

---

# 10. Installation & Setup

## Prerequisites

Before running PranRaksha, install the following:

* Git
* Python 3.10 or higher
* Node.js 18 or higher
* pnpm

## Clone the Repository

Clone the PranRaksha repository:

```bash
git clone https://github.com/Shrizaa/Pranraksha.git
```

Navigate to the project directory:

```bash
cd PranRaksha
```

## Backend Installation

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Installation

Open a **new terminal** while keeping the backend terminal running.

Navigate to the frontend directory:

```bash
cd PranRaksha/frontend
```

Install frontend dependencies:

```bash
pnpm install
```

Start the Next.js development server:

```bash
pnpm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

## Run the Complete Application

Both the backend and frontend must be running simultaneously.

### Terminal 1 – Backend

```bash
cd PranRaksha/backend
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### Terminal 2 – Frontend

```bash
cd PranRaksha/frontend
```

Install dependencies if required:

```bash
pnpm install
```

Start the frontend:

```bash
pnpm run dev
```

Frontend:

```text
http://localhost:3000
```

### Access the Application

Open the application in your browser:

```text
http://localhost:3000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 12. Platform Workflow

```text
User Login
     ↓
Disaster Dashboard
     ↓
View / Report Disaster
     ↓
Risk Assessment
     ↓
Affected Area Analysis
     ↓
Resource Requirement
     ↓
Nearest Warehouse
     ↓
Resource Allocation
     ↓
Shortage Analysis
     ↓
Emergency Response
     ↓
Response Tracking
```

---

## 13. Use Cases

* Disaster risk assessment
* Flood and natural disaster analysis
* Emergency response planning
* Relief resource allocation
* Warehouse and resource management
* Infrastructure analysis
* Disaster reporting
* Disaster history analysis
* Emergency decision support

---

## 14. Future Scope

* Real-time disaster data integration
* Real-time weather and environmental data
* Automated disaster alerts
* Advanced predictive models
* Real-time rescue and relief tracking
* Route optimization
* IoT and sensor integration
* Improved multilingual capabilities
* Integration with additional emergency services

---

## 15. License

This project is licensed under the **MIT License**.


