# GHOST GRID // Aether Institute of Technology Infrastructure Twin

> **Interactive Cascading Failure Simulator & Dependency Visualizer**  
> *Note: This system uses a synthetic fictional campus dataset for interactive vulnerability demonstration and simulation only.*

---

## ⚡ Overview

**GHOST GRID** visualizes hidden infrastructure dependencies and simulates real-time cascading failures across a fictional university campus ("Aether Institute of Technology"). Users can isolate critical power, network, and computing components to observe immediate and secondary cascading failures throughout physical facilities and software services.

---

## 🚀 Key Features

1. **3D Interactive Campus (React Three Fiber)**
   - **Lush Green Campus Environment**: Manicured green lawns, trees, courtyard plazas, and cobblestone/stone pedestrian pathways.
   - **Distinct Architectural Building Textures**:
     - 🏛️ **Collegiate Red Brick & Limestone**: Administration Tower, Gutenberg Central Library, and North Residential Quad.
     - 🔬 **High-Tech Laboratory Facade**: Franklin Science & Engineering Complex with dark titanium panels and glass louvers.
     - 🏥 **Medical Clinic Pavilion**: Aether Student Health & Urgent Care with clean architectural white composite panels and blue windows.
     - 🖥️ **High-Density Data Center Racks**: Alan Turing Computing Facility with server racks, ventilation slots, and LED indicators.
     - ☀️ **Monocrystalline Photovoltaic Grid**: West Campus Solar Farm with deep blue reflective silicon cells.
   - **Architectural Details**: Concrete building foundation pads, rooftop dark slate gravel trims, and rooftop HVAC mechanical units.
   - **Animated 3D Conduits**: Glowing 3D energy and fiber pipelines color-coded by transmission type:
     - ⚡ **Cyan**: Primary High-Voltage & Distribution Power
     - 🟣 **Purple**: Fiber Optic Network Trunks
     - 🟡 **Amber**: Active Backup Lines & Emergency Failover
     - ⬛ **Dim/Red**: Severed / Collapsed Conduits

2. **2D Dependency Graph Mode (React Flow / @xyflow/react)**
   - Seamlessly toggle between 3D Spatial Campus View and 2D Hierarchical Topology.
   - Lane-based layout separating Root Power → Substations & Core Switching → Distribution & Computing → Services → Physical Campus Facilities.

3. **Deterministic Cascade Simulation Engine (NetworkX & FastAPI)**
   - Monotonic fixpoint relaxation algorithm handling multi-hop propagation without infinite loops, even with cyclic dependencies.
   - Automatic backup failover logic (e.g. Data Center diesel generator, Medical Clinic ATS generator, Solar microgrid tie-line, Satellite backup uplink).
   - Step-by-step cascade event timeline recording root causes and triggered dependencies.

4. **Interactive Component Inspector & Control**
   - Click any building, substation, or switch to view its live status, incoming providers, and downstream blast radius.
   - Live **"MANUALLY SEVER / ISOLATE"** and **"RESTORE COMPONENT FEED"** controls with instant cascade re-evaluation.

5. **Disaster Presets & Nominal Restoration**
   - **Preset 1: Substation Transformer Arc Flash**: Severe municipal grid failure; hospital and data center switch to diesel generators while academic halls go dark.
   - **Preset 2: Core Nexus Cyberattack**: Optical router lockout isolating research computing, keycard access, and campus portal.
   - **Preset 3: Storm & Generator Meltdown**: Compound failure knocking out substation and backup diesel generator, collapsing data center and safety interlocks.
   - **"RESTORE NOMINAL" Button**: Instant recovery returning health to 100% with visual celebratory feedback (`canvas-confetti`).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, NetworkX 3.7, Pydantic 2.14, Pytest
- **Frontend**: React 19, TypeScript, Vite 8
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`)
- **2D Graphics**: React Flow (`@xyflow/react`)
- **Icons & Effects**: Lucide React, Canvas Confetti

---

## 🏃 Running Locally

### Backend
```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### Frontend
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Running Automated Tests
```bash
cd backend
.venv\Scripts\pytest.exe -v
```
All 12 test suites covering baseline states, failure propagation, backup failover, local generator isolation, compound disasters, recovery, cyclic dependency stability, and API contracts pass with 100% success.
