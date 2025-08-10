# Product Requirements Document (PRD)
## Aura - No-Code Visual Content Editor

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Project Codename:** Aura  
**Product Manager:** [Your Name]  
**Engineering Lead:** TBD  
**Design Lead:** TBD  

---

## 1. Executive Summary

### 1.1 Problem Statement
Internal teams (Marketing, Product) currently require direct engineering support for creating and modifying simple web layouts and promotional materials. This dependency creates significant bottlenecks in content creation workflows, limits team agility, and increases development overhead for routine visual content tasks that could be self-serviced.

### 1.2 Solution Overview
**Project Codename:** "Aura"  
**Strategic Initiative:** Launch of in-house "No-Code" visual editor  
**Long-term Vision:** Provide Marketing and Product teams with a tool that allows them to build and modify simple web layouts and promotional materials without direct engineering support.

Aura empowers non-technical teams to independently create, modify, and deploy web content through an intuitive drag-and-drop interface with real-time editing capabilities, responsive preview modes, and HTML export functionality.

### 1.3 Success Metrics
- **Primary KPI:** Reduce Marketing/Product team dependency on engineering by 80% for simple layout tasks
- **Secondary KPIs:**
  - Time-to-create content reduced by 60%
  - User adoption rate >90% within first quarter
  - User satisfaction score >4.5/5

### 1.4 Strategic Alignment
- **Business Goal:** Accelerate content creation and reduce engineering bottlenecks
- **User Goal:** Enable self-service content creation for non-technical teams
- **Technical Goal:** Build scalable, maintainable visual editor foundation

---

## 2. Market Research & Competitive Analysis

### 2.1 Reference Solutions
**As specified in the original requirements, refer to these online tools to understand editor functionality:**

- **Beefree:** Email template builder demonstrating drag-and-drop functionality, component selection, and property modification workflows
- **GrapesJS:** Open-source web builder framework showcasing element selection, canvas manipulation, and properties panel interaction

**Key Functionality to Understand:**
- How to select and drop elements on canvas
- Changing properties of selected elements
- Component palette organization and interaction patterns

### 2.2 Competitive Advantages
- **Custom-built:** Tailored specifically for internal team workflows
- **No vendor lock-in:** Complete control over features and data
- **Integration ready:** Can be extended for internal tool ecosystem

---

## 3. User Personas & Use Cases

### 3.1 Primary Personas
**Target Users:** As specified in the requirements - "teams like Marketing and Product"

#### Marketing Team Members (Primary)
- **Role:** Marketing Specialists, Marketing Managers, Content Creators
- **Technical Skill:** Low-Medium (non-technical users)
- **Goals:** Create promotional materials, landing pages, marketing banners, email templates quickly without engineering dependency
- **Pain Points:** 
  - Waiting for engineering support for simple layout changes
  - Limited design flexibility with current tools
  - Slow iteration cycles for marketing campaigns
  - Inability to make real-time content adjustments

#### Product Team Members (Secondary)  
- **Role:** Product Managers, Product Marketing Managers
- **Technical Skill:** Low-Medium (non-technical users)
- **Goals:** Create product showcase pages, feature announcements, product documentation layouts
- **Pain Points:**
  - Engineering bottlenecks for product content creation
  - Slow A/B testing of different layouts
  - Inability to quickly iterate on product messaging
  - Dependency on technical resources for simple visual changes

### 3.2 Use Cases

#### UC1: Create Marketing Landing Page
**Actor:** Marketing Content Creator  
**Goal:** Create a promotional landing page for new product launch  
**Flow:**
1. Select components from palette (Text, Image, Button)
2. Drag components to canvas
3. Customize properties (colors, fonts, sizes)
4. Preview on mobile/desktop
5. Export HTML for deployment

#### UC2: Modify Existing Content
**Actor:** Product Marketing Manager  
**Goal:** Update existing promotional material with new messaging  
**Flow:**
1. Load existing layout from local storage
2. Select and modify text components
3. Adjust styling properties
4. Preview changes
5. Save updated version

---

## 4. Functional Requirements

### 4.1 Core Features (MVP - Must Have)

#### F1: Component Palette System
- **Description:** Left panel displaying available UI components
- **Components:** Text, TextArea, Image, Button
- **Acceptance Criteria:**
  - Palette occupies 20% of screen width
  - Components are visually distinguishable with icons/labels
  - Components can be dragged from palette

#### F2: Drag & Drop Functionality
- **Description:** Native drag-and-drop from palette to canvas
- **Technical Constraint:** Must be built from scratch using native browser events
- **Acceptance Criteria:**
  - Users can drag components from palette to canvas
  - Visual feedback during drag operation
  - Components snap to drop location
  - Drag state is clearly indicated

#### F3: Freeform Canvas
- **Description:** Main editing area where components are placed and manipulated
- **Acceptance Criteria:**
  - Canvas occupies 60% of screen width
  - Components can be positioned anywhere within canvas bounds
  - Selected components show visual selection indicators
  - Canvas supports component reordering

#### F4: Dynamic Properties Panel
- **Description:** Right panel showing properties for selected component
- **Acceptance Criteria:**
  - Panel occupies 20% of screen width
  - Properties update based on selected component type
  - No properties shown when no component is selected
  - Property changes apply in real-time

#### F5: Real-Time Updates
- **Description:** Instant reflection of property changes on canvas
- **Acceptance Criteria:**
  - Property changes update canvas immediately
  - No refresh or save action required
  - Visual feedback for property changes

#### F6: Preview & HTML Export
- **Description:** Preview final output and copy HTML to clipboard
- **Acceptance Criteria:**
  - Preview button shows final rendered output
  - HTML export generates clean, semantic code
  - Copy to clipboard functionality works across browsers
  - **Exact Requirement:** "Provide the ability to preview the final html and also copy the final html to clipboard"

### 4.2 Advanced Features (I3+ Level - Nice to Have)
**Note:** These features are specifically for I3 and above members only.

#### F7: Undo/Redo System
- **Description:** History management for user actions
- **Exact Requirement:** "The application must support a history of at least 50 steps. Users must be able to undo/redo their actions (e.g., adding a component, moving a component, changing a property), with the canvas updating to reflect the state at each step."
- **Acceptance Criteria:**
  - **Minimum 50 steps** in history (exact requirement)
  - Undo/Redo buttons in UI
  - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - **Specific Actions Tracked:**
    - Adding a component
    - Moving a component
    - Changing a property
  - Canvas must update to reflect state at each step

#### F8: Custom Inline Text Editor
- **Description:** Built-in text editing for Text and TextArea components
- **Exact Requirement:** "Develop a custom inline tool editor for Text and TextArea elements"
- **Technical Constraint:** "Do not use inline ckeditor"
- **Acceptance Criteria:**
  - Custom-built inline editor (no third-party solutions)
  - Works specifically for Text and TextArea elements
  - Must be developed from scratch

#### F9: Responsive Preview
- **Description:** Mobile and desktop preview modes
- **Exact Requirement:** "The Preview functionality should support Mobile view as well as Desktop view"
- **Acceptance Criteria:**
  - Toggle between mobile/desktop views
  - Accurate viewport simulation for both modes
  - Components adjust appropriately for each view

### 4.3 Data Persistence
- **Storage:** Browser localStorage
- **Exact Requirement:** "We do not need to build/integrate API to store/persist the content. Kindly leverage browser localstorage for this, treat localstorage as the DB."
- **Data Structure:** JSON format for layouts
- **Acceptance Criteria:**
  - Use localStorage as the primary database
  - No API integration required
  - All content persistence handled client-side
  - Support for saving and loading layouts

---

## 5. Component Specifications

### 5.1 Text Component
**Exact Requirements:** "The below properties should be provided on the right panel:"

**Properties:**
- **Font-size:** Number Input / Slider
- **Font-weight:** Dropdown with exact options:
  - '400 - Normal'
  - '700 - Bold'
- **Color:** Color picker

**Implementation Notes:**
- Properties panel must show these exact controls
- Font-weight dropdown must use the specified text format
- All controls must be functional and update in real-time

### 5.2 TextArea Component
**Exact Requirements:** "The below properties should be provided on the right panel:"

**Properties:**
- **Font-size:** Number Input / Slider
- **Color:** Color picker
- **Text-Align:** Button Group with exact options:
  - 'Left'
  - 'Center' 
  - 'Right'

**Implementation Notes:**
- Text-Align must be implemented as Button Group (not dropdown)
- All three alignment options must be available
- Properties must update canvas in real-time

### 5.3 Image Component
**Exact Requirements:** "The below properties should be provided on the right panel:"

**Properties:**
- **Image URL:** Text Input
- **Alt Text:** Text Input
- **Object Fit:** Dropdown with exact options:
  - 'Cover'
  - 'Contain'
  - 'Fill'
- **Border Radius:** Number Input / Slider
- **Height:** Number Input / Slider
- **Width:** Number Input / Slider

**Implementation Notes:**
- All properties must be editable through right panel
- Object Fit dropdown must contain exactly these three options
- Size controls (Height/Width) must allow precise adjustment
- URL input should validate image URLs

### 5.4 Button Component
**Exact Requirements:** "The below properties should be provided on the right panel:"

**Properties:**
- **URL:** Text Input
- **Button Text:** Text Input
- **Font-size:** Number Input / Slider
- **Padding:** Number Input / Slider
- **Background Color:** Color Picker
- **Text Color:** Color Picker
- **Border Radius:** Number Input / Slider

**Implementation Notes:**
- URL field for button click destination
- Button Text for the displayed label
- All styling properties must be adjustable
- Color pickers for both background and text colors
- Real-time preview of all changes

---

## 6. Technical Requirements

### 6.1 Technology Constraints & Prohibitions
**Exact Requirement:** "The use of comprehensive, 'all-in-one' solution libraries (e.g., GrapesJS, HTML5 canvas, reactdnd etc) that solve the entire problem or part of problem is prohibited."

**Specifically Prohibited Libraries:**
- **GrapesJS** (explicitly mentioned)
- **HTML5 canvas libraries**
- **react-dnd** (explicitly mentioned)
- **konva.js** (explicitly mentioned)
- **interact.js** (explicitly mentioned)
- Any comprehensive "all-in-one" solution libraries
- Any libraries that solve the entire problem or part of the problem

**Critical Drag-and-Drop Constraint:**
**Exact Requirement:** "The drag-and-drop functionality for positioning and moving components on the canvas must be built from scratch using native browser events (mousedown, mousemove, etc.). For this specific requirement, UI interaction libraries like react-dnd, konva.js, interact.js, etc., are prohibited."

### 6.2 Implementation Requirements
- **Drag & Drop:** Must be built from scratch using native browser events:
  - mousedown
  - mousemove
  - mouseup
  - Other native browser events as needed
- **Framework:** Any modern framework (React.js recommended) or Vanilla JavaScript
- **Styling:** CSS3 with modern layout techniques
- **Storage:** localStorage API (treat as database)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)

### 6.3 Performance Requirements
- **Load Time:** < 3 seconds initial load
- **Responsiveness:** < 100ms for property updates
- **Memory Usage:** < 100MB for typical usage
- **Storage Limit:** Respect localStorage 5-10MB limits

---

## 7. User Experience Requirements

### 7.1 Interface Layout
**Exact Requirement:** "The application should have a three-panel layout:"

- **Left (20% width):** Palette Panel - Contains the list of available components
- **Middle (60% width):** Canvas Panel - The main interactive area where components are placed and manipulated  
- **Right (20% width):** Properties Panel - Displays the configuration options for the currently selected component

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, Actions, Preview)                         │
├──────────┬─────────────────────────────┬────────────────┤
│ Palette  │ Canvas                      │ Properties     │
│ (20%)    │ (60%)                       │ (20%)          │
│          │                             │                │
│ [Text]   │ ┌─────────────────────────┐ │ Font Size: 16  │
│ [Image]  │ │ Selected Component      │ │ Color: #000    │
│ [Button] │ │                         │ │ Weight: Normal │
│ [TextArea]│ └─────────────────────────┘ │                │
│          │                             │                │
└──────────┴─────────────────────────────┴────────────────┘
```

**Component Palette Requirements:**
- Must contain exactly these components: Text, TextArea, Image, Button
- Components must be available for dragging to canvas
- Panel must occupy exactly 20% of screen width

**Canvas Requirements:**
- Main interactive area for component placement and manipulation
- Must occupy exactly 60% of screen width
- Support freeform positioning of components
- Allow component selection and movement

**Properties Panel Requirements:**
- Must occupy exactly 20% of screen width
- Display configuration options for currently selected component
- Show different properties based on component type
- Update canvas in real-time when properties change

### 7.2 Interaction Patterns
- **Selection:** Click to select component
- **Multi-selection:** Ctrl+Click (future enhancement)
- **Drag:** Click and drag to move
- **Edit:** Double-click for inline editing
- **Delete:** Delete key or context menu

### 7.3 Visual Design Guidelines
- **Color Scheme:** Modern, professional palette
- **Typography:** Clear, readable fonts
- **Icons:** Consistent icon system
- **Spacing:** Adequate white space for usability
- **Feedback:** Clear visual states (hover, selected, dragging)

---

## 8. Quality Assurance & Testing

### 8.1 Testing Requirements
- **Unit Tests:** Component logic and utilities
- **Integration Tests:** Drag-and-drop workflows
- **E2E Tests:** Complete user journeys
- **Browser Testing:** Cross-browser compatibility
- **Performance Testing:** Memory and load testing

### 8.2 Acceptance Criteria Validation
- All functional requirements must pass testing
- Performance benchmarks must be met
- User experience flows must be intuitive
- Code quality standards must be maintained

---

## 9. Deliverables & Timeline

### 9.1 Required Deliverables
**Exact Requirement:** "Your submission will be a single private GitHub repository containing the following:"

**Critical Note:** "Kindly note the names of each of the expected files should be the same. The automated evaluation mechanism expects that those file names are accurate, if not then it will impact the final score."

#### Required Files (Exact Names):
1. **Source Code:** The complete, running source code, including any data simulators required for testing
2. **README.md:** A clear overview of the project and detailed, step-by-step instructions on how to build and run the entire system locally
3. **PROJECT_STRUCTURE.md:** Explaining the structure of the project and the purpose for each of the folder and key modules
4. **ARCHITECTURE.md:** This is the most important document. It must detail and justify your design:
   - An explanation of your chosen architectural pattern and why you selected it
   - A diagram illustrating the components and their communication flows
   - A Technology Justification section explaining your choice of major technologies and why they were the best fit for this problem
   - A section explaining the "why" behind your state management strategy, component structure, and your approach to the undo/redo functionality
5. **CHAT_HISTORY.md:** A summary document that chronicles your design journey with your AI assistant, highlighting key decision points and how you used AI to evaluate alternatives
6. **Video:** An 8-10 minute video explaining:
   - Design, architecture and the different components and how they communicate with each other
   - Explain the journey from initial brainstorming till the final implementation and the conversation with the coding assistant
   - Key decisions and trade-offs
   - Demo of the entire working of the application
   - Test case coverage %

### 9.2 Repository & Access Requirements
**GitHub Repository:**
- Must be a **private** repository
- **Exact Requirement:** "Create a private GitHub repo and share with the below members:"

**GitHub Access (Exact Usernames):**
- dmistry
- Talnileshmallik1606  
- Sachin-Salunke-Talentica

**Video Upload & Access:**
- **Exact Requirement:** "Upload the video on your one drive and share the access with the below members:"
- **OneDrive Access (Exact Email Addresses):**
  - Dipen.mistry@talentica.com
  - Nilesh.Mallick@talentica.com
  - Sachin.Salunke@talentica.com

---

## 10. Risk Assessment & Mitigation

### 10.1 Technical Risks
- **Risk:** Complex drag-and-drop implementation without libraries
- **Mitigation:** Prototype core functionality early, iterative development

- **Risk:** Browser compatibility issues
- **Mitigation:** Progressive enhancement, polyfills where needed

- **Risk:** Performance issues with complex layouts
- **Mitigation:** Implement virtual scrolling, optimize rendering

### 10.2 User Adoption Risks
- **Risk:** Learning curve for non-technical users
- **Mitigation:** Intuitive UI design, comprehensive documentation

- **Risk:** Limited component variety
- **Mitigation:** Extensible architecture for future components

---

## 11. Future Enhancements

### 11.1 Phase 2 Features
- Additional components (Video, Form elements, Layout containers)
- Template library with pre-built layouts
- Collaboration features (comments, sharing)
- Version control and branching

### 11.2 Integration Opportunities
- CMS integration for content publishing
- Asset management system integration
- Analytics and A/B testing capabilities
- API for programmatic content creation

---

## 12. Success Metrics & KPIs

### 12.1 Launch Metrics (First 30 days)
- User registration rate
- Feature adoption rates
- Time to first successful layout creation
- User feedback scores

### 12.2 Long-term Metrics (Quarterly)
- Engineering request reduction percentage
- Content creation velocity improvement
- User retention and engagement
- Feature utilization rates

---

## 13. Appendices

### 13.1 Glossary
- **Component:** Reusable UI element (Text, Image, Button, etc.)
- **Canvas:** Main editing area where components are placed
- **Palette:** Component library panel
- **Properties Panel:** Configuration panel for selected components

### 13.2 Technical References
- HTML5 Drag and Drop API documentation
- CSS Grid and Flexbox specifications
- localStorage API documentation
- Modern JavaScript event handling patterns

---

**Document Approval:**
- [ ] Product Manager
- [ ] Engineering Lead  
- [ ] Design Lead
- [ ] Stakeholder Sign-off

**Next Steps:**
1. Technical architecture review
2. UI/UX design mockups
3. Development sprint planning
4. Stakeholder feedback incorporation 