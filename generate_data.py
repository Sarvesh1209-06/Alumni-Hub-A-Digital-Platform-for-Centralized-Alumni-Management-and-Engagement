import json
import random
import os

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Helper Lists for Realistic Generation
departments = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Artificial Intelligence and Data Science"
]

first_names = [
    "Aarav", "Aditya", "Akash", "Ananya", "Arjun", "Amit", "Bhavna", "Chaitanya", "Deepak", "Divya",
    "Gaurav", "Harsh", "Isha", "Karan", "Kavita", "Madhav", "Neha", "Pranav", "Pooja", "Rahul",
    "Rohan", "Riya", "Sanjay", "Shreya", "Siddharth", "Sneha", "Tarun", "Varun", "Vikram", "Yash",
    "John", "Sarah", "Michael", "Emily", "David", "Jessica", "Daniel", "Rachel", "James", "Sophia",
    "Rajesh", "Sunita", "Vijay", "Aisha", "Kabir", "Meera", "Zara", "Dev", "Kriti"
]

last_names = [
    "Sharma", "Verma", "Gupta", "Patel", "Mehta", "Singh", "Reddy", "Nair", "Joshi", "Rao",
    "Kumar", "Das", "Choudhury", "Sen", "Bose", "Mishra", "Pandey", "Iyer", "Pillai", "Deshmukh",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
    "Chatterjee", "Mukherjee", "Banerjee", "Roy", "Dutta", "Saha", "Ghosh", "Kar", "Pal", "Adhikary"
]

companies = [
    "Google", "Microsoft", "Amazon", "Meta", "Apple", "TCS", "Infosys", "Wipro", "Cognizant",
    "Accenture", "Deloitte", "Capgemini", "L&T", "Tesla", "Nvidia", "Adobe", "Salesforce",
    "Netflix", "Intel", "Qualcomm", "Oracle", "Cisco", "IBM", "JP Morgan", "Goldman Sachs"
]

designations = [
    "Software Engineer", "Senior Software Engineer", "Product Manager", "Data Scientist",
    "System Analyst", "UI/UX Designer", "DevOps Engineer", "Cloud Architect", "Project Manager",
    "Technical Lead", "QA Automation Engineer", "Business Analyst", "Hardware Engineer",
    "Network Engineer", "Full Stack Developer", "Data Engineer", "Consultant", "Director of Engineering"
]

cities = [
    "Bangalore", "Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi", "Kolkata", "Noida",
    "San Francisco", "New York", "London", "Seattle", "Austin", "Dublin", "Singapore", "Sydney"
]

states_by_city = {
    "Bangalore": ("Karnataka", "India"),
    "Chennai": ("Tamil Nadu", "India"),
    "Hyderabad": ("Telangana", "India"),
    "Mumbai": ("Maharashtra", "India"),
    "Pune": ("Maharashtra", "India"),
    "Delhi": ("Delhi", "India"),
    "Kolkata": ("West Bengal", "India"),
    "Noida": ("Uttar Pradesh", "India"),
    "San Francisco": ("California", "USA"),
    "New York": ("New York", "USA"),
    "London": ("Greater London", "UK"),
    "Seattle": ("Washington", "USA"),
    "Austin": ("Texas", "USA"),
    "Dublin": ("Leinster", "Ireland"),
    "Singapore": ("Central Region", "Singapore"),
    "Sydney": ("New South Wales", "Australia")
}

skills_pool = [
    "JavaScript", "Python", "Java", "C++", "HTML/CSS", "React", "Node.js", "SQL", "NoSQL",
    "AWS", "Docker", "Kubernetes", "Git", "Machine Learning", "Data Structures", "Algorithms",
    "TypeScript", "Angular", "Vue.js", "Django", "Flask", "Spring Boot", "UI/UX Design", "Figma"
]

universities = [
    "IIT Madras", "IISc Bangalore", "Stanford University", "MIT", "Carnegie Mellon",
    "University of Oxford", "Bits Pilani", "IIT Bombay", "University of Texas at Austin",
    "National University of Singapore"
]

courses = [
    "M.S. in Computer Science", "M.Tech in AI", "MBA in Systems", "Ph.D. in Data Science",
    "M.S. in Software Engineering", "PGDM in Business Analytics"
]

entrepreneur_companies = [
    "TechVantage Solutions", "InnovateEdu", "AlphaStream Analytics", "OmniNet Technologies",
    "EcoGrid Energy", "MediLink Diagnostics", "Apex FinTech", "Quantum CyberSec", "BlueSky AgriTech"
]

# 1. Alumni Generation (500 records)
alumni = []
used_reg_nums = set()

# Force first alumni record to be Aarav Sharma for user@college.edu mapping
first_alumni = {
    "id": 1,
    "registerNumber": "18104592",
    "name": "Aarav Sharma",
    "gender": "Male",
    "department": "Computer Science and Engineering",
    "batch": 2018,
    "email": "aarav.sharma@gmail.com",
    "phone": "+91 98765 43210",
    "company": "Google",
    "designation": "Senior Software Engineer",
    "salary": 2800000,
    "experience": 8,
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "linkedin": "https://linkedin.com/in/aarav-sharma-18104592",
    "skills": ["JavaScript", "Python", "System Design", "Cloud Architecture"],
    "higherStudies": "",
    "entrepreneur": "",
    "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav"
}
alumni.append(first_alumni)
used_reg_nums.add("18104592")

for i in range(2, 501):
    f_name = random.choice(first_names)
    l_name = random.choice(last_names)
    name = f"{f_name} {l_name}"
    gender = "Female" if f_name in ["Ananya", "Bhavna", "Divya", "Isha", "Kavita", "Neha", "Pooja", "Riya", "Shreya", "Sneha", "Sarah", "Emily", "Jessica", "Rachel", "Sophia", "Sunita", "Aisha", "Meera", "Zara", "Kriti"] else "Male"
    
    # Department & Batch
    dept = random.choice(departments)
    batch = random.randint(2010, 2025)
    
    # Registration number (unique)
    while True:
        reg_num = f"{batch % 100}{random.randint(1000, 9999)}"
        if reg_num not in used_reg_nums:
            used_reg_nums.add(reg_num)
            break
            
    email = f"{f_name.lower()}.{l_name.lower()}{reg_num}@gmail.com"
    phone = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
    
    # Entrepreneur or Higher Studies or Placed
    status_roll = random.random()
    company = ""
    designation = ""
    salary = 0
    experience = 2026 - batch - random.randint(0, 1)
    if experience < 0: experience = 0
    
    higher_studies = ""
    entrepreneur = ""
    
    if status_roll < 0.08:  # Entrepreneur
        entrepreneur = "Founder & CEO"
        company = random.choice(entrepreneur_companies)
        designation = "Founder / CEO"
        salary = random.randint(15, 60) * 100000
    elif status_roll < 0.18: # Higher Studies
        higher_studies = f"{random.choice(courses)} at {random.choice(universities)}"
        company = "Higher Education"
        designation = "Student"
        salary = 0
    else:  # Placed
        company = random.choice(companies)
        designation = random.choice(designations)
        base_salary = random.randint(4, 10)
        experience_bonus = experience * random.randint(150000, 350000)
        salary = base_salary * 100000 + experience_bonus
        if salary > 8500000: salary = 8500000
        
    city = random.choice(cities)
    state, country = states_by_city[city]
    
    linkedin = f"https://linkedin.com/in/{f_name.lower()}-{l_name.lower()}-{reg_num}"
    skills = random.sample(skills_pool, k=random.randint(3, 6))
    photo = f"https://api.dicebear.com/7.x/avataaars/svg?seed={f_name}{reg_num}"
    
    alumni.append({
        "id": i,
        "registerNumber": reg_num,
        "name": name,
        "gender": gender,
        "department": dept,
        "batch": batch,
        "email": email,
        "phone": phone,
        "company": company,
        "designation": designation,
        "salary": int(salary),
        "experience": experience,
        "city": city,
        "state": state,
        "country": country,
        "linkedin": linkedin,
        "skills": skills,
        "higherStudies": higher_studies,
        "entrepreneur": entrepreneur,
        "photo": photo
    })

# Write alumni.json
with open('data/alumni.json', 'w') as f:
    json.dump(alumni, f, indent=2)

# 2. Users Generation (50 users linked to Alumni)
users = []
# Default Admin
users.append({
    "id": 1,
    "name": "Administrator",
    "email": "admin@college.edu",
    "password": "admin",
    "role": "admin",
    "alumniId": None,
    "photo": "https://api.dicebear.com/7.x/adventurer/svg?seed=admin"
})

# Sarvesh Admin
users.append({
    "id": 2,
    "name": "Sarvesh",
    "email": "lolsarvesh2006@gmail.com",
    "password": "qwertyuiopasdfghjkl",
    "role": "admin",
    "alumniId": None,
    "photo": "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarvesh"
})

# Default Demo User mapped to Alumnus #1 (Aarav Sharma)
users.append({
    "id": 3,
    "name": "Aarav Sharma",
    "email": "user@college.edu",
    "password": "user123",
    "role": "alumni",
    "alumniId": 1,
    "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav"
})

# Generate next 47 users mapping to alumni records (indices 1 to 47, i.e., id 4 to 50)
for i in range(4, 51):
    mapped_alumnus = alumni[i - 2] # index offset to avoid matching Aarav (index 0) or off-limits
    users.append({
        "id": i,
        "name": mapped_alumnus["name"],
        "email": mapped_alumnus["email"],
        "password": "password123",
        "role": "alumni",
        "alumniId": mapped_alumnus["id"],
        "photo": mapped_alumnus["photo"]
    })

# Write users.json
with open('data/users.json', 'w') as f:
    json.dump(users, f, indent=2)

# 3. Events Generation (50 events)
events = []
event_types = [
    "Alumni Meet", "Guest Lecture", "Career Guidance Seminar", "Webinar", 
    "Hackathon Mentor Session", "Mock Interviews", "Placement Prep Workshop", "Networking Dinner"
]

event_desc = [
    "An interactive session sharing real-world industry experience, latest tools, and pathways to success.",
    "Reconnecting with old classmates, sharing college memories, and exploring collaboration projects.",
    "A deep-dive technical workshop on emerging industry technologies and skill development.",
    "Mentorship round-table to help junior students structure their engineering profiles.",
    "Exclusive placement guidance session focusing on technical and HR rounds for top product companies."
]

for i in range(1, 51):
    ev_type = random.choice(event_types)
    dept = random.choice(departments + ["All Departments"])
    year = 2026
    month = random.randint(7, 12)
    day = random.randint(1, 28)
    date_str = f"{year}-{month:02d}-{day:02d}"
    time_str = f"{random.randint(9, 18):02d}:00"
    loc = random.choice(["Main Auditorium", "Seminar Hall A", "CSE Conference Room", "Virtual Zoom Meeting", "College Tech Hub"])
    
    reg_count = random.randint(5, 45)
    reg_users = [u["email"] for u in random.sample(users, k=min(reg_count, len(users)))]
    
    events.append({
        "id": i,
        "title": f"{ev_type} on {random.choice(['AI/ML Trends', 'Web Development', 'Higher Studies Abroad', 'VLSI Design', 'Core Mechanical Innovation', 'Cloud Architecture', 'Entrepreneurship Startup Life'])}",
        "description": random.choice(event_desc),
        "date": date_str,
        "time": time_str,
        "location": loc,
        "department": dept,
        "registeredCount": len(reg_users),
        "registeredUsers": reg_users
    })

# Write events.json
with open('data/events.json', 'w') as f:
    json.dump(events, f, indent=2)

# 4. Jobs Generation (50 jobs)
jobs = []
job_types = [
    "Full-time Software Engineer", "Data Analyst Intern", "Graduate Engineer Trainee",
    "Systems Engineer", "VLSI Design Engineer", "Structural Engineering Associate",
    "Product Analyst", "Associate Full Stack Developer", "AI Research Intern"
]

job_desc = [
    "Looking for a motivated graduate with strong foundation in data structures, algorithms, and analytical thinking.",
    "Responsible for designing, building, and maintaining code modules, writing unit tests, and documenting configurations.",
    "Collaborate with multi-functional teams to research, design, develop, test, and release robust engineering products.",
    "Analyze data patterns, build statistical models, and communicate insights to the product and operations teams."
]

for i in range(1, 51):
    title = random.choice(job_types)
    comp = random.choice(companies)
    dept = random.choice(departments)
    salary_range = f"{random.randint(5, 12)}L - {random.randint(14, 25)}L LPA"
    exp = f"{random.randint(0, 2)} years"
    loc = random.choice(cities)
    
    app_count = random.randint(2, 20)
    applied_users = []
    sampled_users = random.sample(users, k=min(app_count, len(users)))
    for u in sampled_users:
        applied_users.append({
            "email": u["email"],
            "status": random.choice(["Applied", "Under Review", "Interview Scheduled", "Shortlisted", "Rejected"])
        })
        
    jobs.append({
        "id": i,
        "title": title,
        "company": comp,
        "description": random.choice(job_desc),
        "location": loc,
        "salary": salary_range,
        "experienceRequired": exp,
        "department": dept,
        "appliedCount": len(applied_users),
        "appliedUsers": applied_users
    })

# Write jobs.json
with open('data/jobs.json', 'w') as f:
    json.dump(jobs, f, indent=2)

# 5. Mentors Generation (100 mentors)
mentors = []
for i in range(1, 101):
    f_name = random.choice(first_names)
    l_name = random.choice(last_names)
    name = f"{f_name} {l_name}"
    dept = random.choice(departments)
    batch = random.randint(2010, 2022)
    comp = random.choice(companies)
    desg = random.choice(designations)
    email = f"{f_name.lower()}.{l_name.lower()}{batch}@gmail.com"
    skills = random.sample(skills_pool, k=random.randint(3, 5))
    
    days = random.sample(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], k=random.randint(2, 3))
    availability = [f"{d} 5:00 PM - 7:00 PM" for d in days]
    
    req_users = []
    req_count = random.randint(0, 5)
    sampled_users = random.sample(users, k=min(req_count, len(users)))
    for u in sampled_users:
        req_users.append({
            "email": u["email"],
            "status": random.choice(["Pending", "Approved", "Completed", "Declined"]),
            "message": "Looking for industry guidance and career progression tips."
        })
        
    mentors.append({
        "id": i,
        "name": name,
        "company": comp,
        "designation": desg,
        "department": dept,
        "batch": batch,
        "email": email,
        "skills": skills,
        "availability": availability,
        "requestedUsers": req_users
    })

# Write mentors.json
with open('data/mentors.json', 'w') as f:
    json.dump(mentors, f, indent=2)

print("All linked dataset files written successfully.")
