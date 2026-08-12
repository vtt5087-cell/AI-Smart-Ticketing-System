with open("src/components/UserDashboard.tsx", "r") as f:
    text = f.read()

text = text.replace("setSelectedStatusFilter,\n  Archive", "setSelectedStatusFilter")
text = text.replace("Filter,\n  Archive", "Filter")

with open("src/components/UserDashboard.tsx", "w") as f:
    f.write(text)
