from django.shortcuts import render

def index(request, projectId):
    return render(request, 'frontend/index.html', {'projectid':projectId})
    