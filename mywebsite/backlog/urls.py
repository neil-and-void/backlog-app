from django.urls import path
from django.contrib.auth import login

from . import views

app_name='backlog'
urlpatterns = [
    path('login',views.login, name='login'),
    path('register', views.register, name='register'),
    path('projects', views.projects, name='projects'),
    path('api/column/<int:projectId>/', views.ColumnListCreate.as_view()),
    path('api/task/<int:columnId>/', views.TaskListCreate.as_view()),
    path('api/project/<int:projectId>', views.ProjectListCreate.as_view()),
    path('api/get_csrf/', views.get_csrf, name='get_csrf'),
]