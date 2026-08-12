with open("src/components/UserDashboard.tsx", "r") as f:
    text = f.read()

text = text.replace("selectedCategoryFilter,\n  Archive", "selectedCategoryFilter")
text = text.replace("selectedStatusFilter,\n  Archive", "selectedStatusFilter")
text = text.replace("<Filter,\n  Archive", "<Filter")
text = text.replace("setSelectedCategoryFilter,\n  Archive", "setSelectedCategoryFilter")

with open("src/components/UserDashboard.tsx", "w") as f:
    f.write(text)
