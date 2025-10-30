import { LearningPath, ColumnType, SectionType } from '../types';

// Define a constant ID for the pre-built path to easily check for its existence.
export const SELF_LEARNING_PATH_ID = 'prebuilt-self-learning-path';

// Define IDs for all structural elements to ensure consistency
const ROOT_COLUMN_ID = 'self-learning-root';
const FOUNDATIONS_ITEM_ID = 'self-learning-item-foundations';
const STRATEGIES_ITEM_ID = 'self-learning-item-strategies';
const TOOLS_ITEM_ID = 'self-learning-item-tools';
const APPLYING_ITEM_ID = 'self-learning-item-applying';
const MOMENTUM_ITEM_ID = 'self-learning-item-momentum';

const FOUNDATIONS_COL_ID = 'self-learning-col-foundations';
const STRATEGIES_COL_ID = 'self-learning-col-strategies';
const TOOLS_COL_ID = 'self-learning-col-tools';
const APPLYING_COL_ID = 'self-learning-col-applying';
const MOMENTUM_COL_ID = 'self-learning-col-momentum';

const TOOLS_COURSES_ITEM_ID = 'self-learning-item-courses';
const TOOLS_BOOKS_ITEM_ID = 'self-learning-item-books';
const TOOLS_COMMUNITY_ITEM_ID = 'self-learning-item-community';

const COURSES_COL_ID = 'self-learning-col-courses';
const BOOKS_COL_ID = 'self-learning-col-books';
const COMMUNITY_COL_ID = 'self-learning-col-community';

export const getSelfLearningPath = (): LearningPath => {
    const selfLearningPath: LearningPath = {
        id: SELF_LEARNING_PATH_ID,
        title: 'The Art of Self-Learning',
        createdAt: new Date().toISOString(),
        isMajor: false,
        columns: [
            // Root Column
            {
                id: ROOT_COLUMN_ID,
                title: 'The Art of Self-Learning',
                type: ColumnType.BRANCH,
                parentItemId: null,
                width: 320,
                items: [
                    { id: FOUNDATIONS_ITEM_ID, title: 'Foundations of Self-Learning' },
                    { id: STRATEGIES_ITEM_ID, title: 'Strategies for Effective Learning' },
                    { id: TOOLS_ITEM_ID, title: 'Tools and Resources' },
                    { id: APPLYING_ITEM_ID, title: 'Applying and Mastering Skills' },
                    { id: MOMENTUM_ITEM_ID, title: 'Maintaining Momentum' },
                ],
                sections: [],
            },
            // Foundations Column
            {
                id: FOUNDATIONS_COL_ID,
                title: 'Foundations of Self-Learning',
                type: ColumnType.DYNAMIC,
                parentItemId: FOUNDATIONS_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'What is Self-Learning?' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Self-learning, or autodidacticism, is the process of acquiring knowledge or skills without the direct supervision of a teacher. It's about taking ownership of your education, driven by curiosity and personal goals." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Setting Clear Goals' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "To give your learning direction, define goals that are Specific, Measurable, Achievable, Relevant, and Time-bound (SMART). This clarity prevents aimless study and provides motivation." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'The Mindset of a Self-Learner' } },
                    { id: crypto.randomUUID(), type: SectionType.BULLETS, content: { ordered: false, items: [
                        "Curiosity: A genuine desire to know and understand.",
                        "Discipline: The commitment to stick to your learning plan.",
                        "Growth Mindset: Believing that abilities can be developed through dedication and hard work.",
                        "Resilience: Overcoming challenges and learning from mistakes.",
                    ]}},
                    { id: crypto.randomUUID(), type: SectionType.QANDA, content: { question: "Is self-learning better than traditional education?", answer: "Neither is inherently 'better.' They serve different purposes and can complement each other. Self-learning offers flexibility and personalization, while traditional education provides structure and expert guidance. The most effective learners often combine both.", isCollapsed: true }},
                ],
            },
            // Strategies Column
            {
                id: STRATEGIES_COL_ID,
                title: 'Strategies for Effective Learning',
                type: ColumnType.DYNAMIC,
                parentItemId: STRATEGIES_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'Proven Learning Techniques' } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Active Recall' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Instead of passively re-reading material, actively try to retrieve information from your memory. This strengthens neural pathways. Flashcards and self-quizzing are great examples." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Spaced Repetition' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Review information at increasing intervals over time. This technique combats the 'forgetting curve' and helps move information into long-term memory." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'The Feynman Technique' } },
                    { id: crypto.randomUUID(), type: SectionType.BULLETS, content: { ordered: true, items: [
                        "Choose a concept you want to understand.",
                        "Explain it in simple terms, as if you were teaching it to a child.",
                        "Identify gaps in your explanation and go back to the source material to fill them.",
                        "Review and simplify your explanation again.",
                    ]}},
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Chunking' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Break down complex information into smaller, manageable pieces (chunks). Master one chunk before moving to the next. This prevents cognitive overload." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Effective Note-Taking' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Don't just transcribe; synthesize. Use methods like Cornell Notes or Zettelkasten to connect ideas and create a personal knowledge base." } },
                    { id: crypto.randomUUID(), type: SectionType.LINK, content: { text: 'Learn more about effective learning strategies', url: 'https://www.coursera.org/articles/learning-how-to-learn' }},
                ],
            },
            // Tools & Resources Column (Branch)
            {
                id: TOOLS_COL_ID,
                title: 'Tools and Resources',
                type: ColumnType.BRANCH,
                parentItemId: TOOLS_ITEM_ID,
                width: 320,
                items: [
                    { id: TOOLS_COURSES_ITEM_ID, title: 'Online Courses' },
                    { id: TOOLS_BOOKS_ITEM_ID, title: 'Books and Articles' },
                    { id: TOOLS_COMMUNITY_ITEM_ID, title: 'Community and Collaboration' },
                ],
                sections: [],
            },
            // Online Courses Column
            {
                id: COURSES_COL_ID,
                title: 'Online Courses',
                type: ColumnType.DYNAMIC,
                parentItemId: TOOLS_COURSES_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'Where to Find Quality Courses' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Massive Open Online Courses (MOOCs) have revolutionized access to education. Here are some of the top platforms:" } },
                    { id: crypto.randomUUID(), type: SectionType.TABLE, content: { cells: [
                        ["Platform", "Best For"],
                        ["Coursera / edX", "University-level courses, specializations, and professional certificates."],
                        ["Udemy / Skillshare", "Practical skills, creative pursuits, and a wide variety of topics."],
                        ["Khan Academy", "Free academic subjects, from K-12 to early college."],
                    ]}},
                ],
            },
            // Books and Articles Column
            {
                id: BOOKS_COL_ID,
                title: 'Books and Articles',
                type: ColumnType.DYNAMIC,
                parentItemId: TOOLS_BOOKS_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'Building Your Digital Library' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Beyond structured courses, reading is fundamental. Use these resources to find high-quality content." } },
                    { id: crypto.randomUUID(), type: SectionType.BULLETS, content: { ordered: false, items: [
                        "**Google Scholar:** For academic papers and research.",
                        "**Medium/Substack:** For articles from experts and practitioners in various fields.",
                        "**Project Gutenberg:** For free public domain e-books.",
                    ]}},
                    { id: crypto.randomUUID(), type: SectionType.VIDEO, content: { url: "https://www.youtube.com/watch?v=vge9LQIV1bg", dataUrl: null, width: 100 }},
                ],
            },
            // Community Column
            {
                id: COMMUNITY_COL_ID,
                title: 'Community and Collaboration',
                type: ColumnType.DYNAMIC,
                parentItemId: TOOLS_COMMUNITY_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Learning doesn't have to be a solo journey. Engaging with others can accelerate your progress and provide support." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Where to Connect' } },
                    { id: crypto.randomUUID(), type: SectionType.BULLETS, content: { ordered: false, items: [
                        "**Discord/Slack:** Find communities dedicated to your topic of interest.",
                        "**Reddit:** Subreddits like r/learnprogramming or r/history can be valuable.",
                        "**Local Meetups:** Use platforms like Meetup.com to find people with similar interests in your area.",
                    ]}},
                ],
            },
            // Applying Skills Column
            {
                id: APPLYING_COL_ID,
                title: 'Applying and Mastering Skills',
                type: ColumnType.DYNAMIC,
                parentItemId: APPLYING_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'From Knowledge to Mastery' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "True learning happens when you apply what you've learned. The goal is to move from passive consumption to active creation." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Project-Based Learning' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Instead of just completing exercises, build a real project. If you're learning to code, build a small app. If you're learning history, write a research paper on a topic that fascinates you. This solidifies knowledge and gives you something to show for your efforts." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Teach What You Learn' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Solidify your understanding by explaining concepts to others. This could be through a blog post, a presentation to a friend, or even just talking to yourself. It quickly reveals what you don't truly understand." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'The Importance of Feedback' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Actively seek constructive feedback on your projects and understanding. It provides an external perspective that is crucial for identifying blind spots and accelerating improvement." } },
                ],
            },
            // Maintaining Momentum Column
            {
                id: MOMENTUM_COL_ID,
                title: 'Maintaining Momentum',
                type: ColumnType.DYNAMIC,
                parentItemId: MOMENTUM_ITEM_ID,
                width: 320,
                items: [],
                sections: [
                    { id: crypto.randomUUID(), type: SectionType.HEADING, content: { text: 'Staying Motivated for the Long Haul' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Motivation can wane. Building sustainable habits is key." } },
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Tips for Consistency' } },
                    { id: crypto.randomUUID(), type: SectionType.BULLETS, content: { ordered: false, items: [
                        "**Set Clear Goals:** Know *why* you are learning something.",
                        "**Track Your Progress:** Use a journal or app to see how far you've come.",
                        "**Don't Be Afraid to Pivot:** If a resource isn't working for you, find another one.",
                        "**Celebrate Small Wins:** Acknowledge your achievements along the way to stay encouraged.",
                    ]}},
                    { id: crypto.randomUUID(), type: SectionType.SUB_HEADING, content: { text: 'Overcoming Procrastination' } },
                    { id: crypto.randomUUID(), type: SectionType.PARAGRAPH, content: { text: "Use techniques like the 'Pomodoro Technique' (25 minutes of focused work followed by a 5-minute break) or the '2-Minute Rule' (if a task takes less than two minutes, do it now) to get started." } },
                    { id: crypto.randomUUID(), type: SectionType.QANDA, content: { question: "What if I feel burnt out?", answer: "Burnout is a signal to rest, not to quit. Take a planned break, reconnect with your 'why', and adjust your goals if they are too aggressive. Learning is a marathon, not a sprint.", isCollapsed: true }},
                ],
            },
        ],
    };
    return selfLearningPath;
};