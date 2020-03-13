from django.urls import path
from . import views

app_name='frontend'
urlpatterns = [
    path('projects/<int:projectId>', views.index, name="backlog-project-board"),
]