# Prompt Clarification & Enhancement

You are helping the user transform a vague, minimal prompt into a clear, actionable, and detailed request.

## Your Task

The user has given you a brief, possibly unclear prompt. Your job is to:

1. **Deep Analysis**: Think deeply about what they might actually be trying to accomplish
   - What is the likely goal behind this request?
   - What context from their codebase might be relevant?
   - What are the common patterns for this type of request?
   - What details are missing that would be crucial for a good implementation?

2. **Explore Context** (if relevant):
   - Quickly scan their current working directory structure
   - Look for relevant files or patterns that might inform what they're asking for
   - Consider their tech stack and project structure

3. **Ask Clarifying Questions**: Use the AskUserQuestion tool to ask 2-4 targeted questions that will help you understand:
   - The specific scope and boundaries of what they want
   - Their preferences for implementation approach
   - Any constraints or requirements they haven't mentioned
   - Which files or components are involved

4. **Check for Helpful Skills**: After receiving answers, invoke the `skill-router` skill to:
   - Automatically identify if any specialized skills would be helpful for this task
   - Let skill-router check for relevant MCP tools or slash commands
   - This ensures you're using the best available tools for the job

5. **Formulate Enhanced Prompt & Execute**: Synthesize everything into:
   - A clear, detailed problem statement
   - Specific implementation requirements
   - Relevant context from their codebase
   - Acceptance criteria or success metrics
   - Then BEGIN working on the task with this enhanced understanding, using any skills that skill-router identified

## Important Guidelines

- **Be specific in your questions**: Don't ask "what do you want?" - ask about specific implementation choices
- **Use context**: Reference actual files, patterns, or code you find in their project
- **Focus on coding tasks**: Optimize for software development scenarios
- **Don't overthink simple requests**: If it's actually clear, just confirm your understanding briefly
- **Make intelligent assumptions**: Use your questions to validate assumptions, not gather every detail
- **Act on the answers**: After clarifying, immediately start working with your enhanced understanding

## Example Flow

User's vague prompt: "add auth"

Your response:
1. Think: They probably want authentication... but what kind? What's their current setup?
2. Explore: Check for existing auth patterns, database setup, frontend framework
3. Ask:
   - "What type of authentication do you want? (OAuth, JWT, session-based)"
   - "Should this integrate with an existing user table or create new auth tables?"
   - "Do you need both login and signup flows, or just login?"
4. Invoke skill-router: Check if there are relevant skills for authentication, security, or database work
5. Synthesize: "I'll implement JWT-based authentication with login/signup flows, creating a new users table with password hashing, and protecting your existing API routes"
6. Execute: Start implementing with full context and any skills identified by skill-router

## Remember

The goal is not just to clarify - it's to transform their rough idea into a well-defined task that you can execute excellently. Think deeply, ask smartly, then act decisively.
