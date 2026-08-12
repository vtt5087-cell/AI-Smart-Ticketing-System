import re

with open("src/components/UserDashboard.tsx", "r") as f:
    text = f.read()

# completely clean up imports
text = text.replace("import { Bell, Bell } from \"lucide-react\";", "")
text = text.replace("import { Bell, motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';")
text = text.replace("import { Bell,   Bell,", "import {   Bell,")
text = text.replace("import { Bell, Ticket, TicketStatus, TicketCategory } from '../types';", "import { Ticket, TicketStatus, TicketCategory } from '../types';")
text = text.replace("import { Bell, React, { useState } from 'react';", "import React, { useState } from 'react';")

with open("src/components/UserDashboard.tsx", "w") as f:
    f.write(text)

with open("src/components/AgentDashboard.tsx", "r") as f:
    text = f.read()

text = text.replace("import { Bell, Bell } from \"lucide-react\";", "")
text = text.replace("import { Bell, motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';")
text = text.replace("import { Bell,   Bell,", "import {   Bell,")
text = text.replace("import { Bell, Ticket, TicketStatus, TicketCategory, AgentUser } from '../types';", "import { Ticket, TicketStatus, TicketCategory, AgentUser } from '../types';")
text = text.replace("import { Bell, React, { useState, useRef, useEffect, useMemo } from 'react';", "import React, { useState, useRef, useEffect, useMemo } from 'react';")

with open("src/components/AgentDashboard.tsx", "w") as f:
    f.write(text)
