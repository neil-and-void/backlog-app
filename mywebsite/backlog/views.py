from django.shortcuts import render,redirect
from django.http import HttpResponse
from django.contrib import messages
from django.template import loader
from django.contrib.auth.models import User, auth
from django.contrib.auth import authenticate
from backlog.models import Project, Column, Task
from .serializers import ColumnSerializer, TaskSerializer, ProjectSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from http.client import responses

from .accountvalidator import AccountChecker

import json


class ColumnListCreate(generics.ListCreateAPIView):
    serializer_class = ColumnSerializer
    def get_queryset(self):
        queryset = Column.objects.all()
        projectId = self.kwargs.get("projectId")
        if projectId is not None:
            queryset = queryset.filter(projectId=projectId)
        return queryset 

    def post(self, request, projectId):
        serializer = ColumnSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, projectId):
        columnIdToDelete = request.data['columnId']
        try:
            Column.objects.filter(pk=columnIdToDelete).delete()
            return Response({"Task delete success"}, status=status.HTTP_204_NO_CONTENT)

        except:
            return Response("Task delete failed", status=status.HTTP_400_BAD_REQUEST)
   

class TaskListCreate(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all()
        columnId = self.kwargs.get("columnId")
        if columnId is not None:
            queryset = queryset.filter(columnId=columnId)
        return queryset

    def post(self, request, columnId):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, columnId):
        taskIdToDelete = request.data['taskId']
        try:
            Task.objects.filter(pk=taskIdToDelete).delete()
            return Response({"Task delete success"}, status=status.HTTP_204_NO_CONTENT)

        except:
            return Response("Task delete failed", status=status.HTTP_400_BAD_REQUEST)
   
    def patch(self, request, columnId):
        try:
            # get task to update 
            taskId = request.data['taskId']
            task = Task.objects.get(pk=taskId)

            # get new column for task to reference
            newColumn = Column.objects.get(pk=columnId)
            
            # save update
            task.columnId = newColumn
            task.save()
            print(task.columnId, newColumn)
            return Response({"Task patch success"}, status=status.HTTP_200_OK)

        except:
            return Response("Task patch failed", status=status.HTTP_400_BAD_REQUEST)

class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = Project.objects.all()
        projectId = self.kwargs.get('projectId')
        if projectId is not None:
            queryset = queryset.filter(projectId=projectId)
        return queryset

def get_csrf(request):
    return HttpResponse("{0}".format(csrf.get_token(request)), content_type="text/plain")


def login(request):
    if request.method == 'POST':
        # get user credentials
        username = request.POST.get('username')
        password = request.POST.get('password')

        # verify credentials and log user in
        user = authenticate(username=username, password=password)
        if user is not None:
            auth.login(request, user)
            return redirect('backlog:projects')

        # invalid credentials
        else: 
            messages.error(request, 'Invalid credentials')
            return redirect('backlog:login')

    # displaying error messages 
    else: 
        return render(request, 'backlog/login.html')


def registerView(request):
    return render(request, 'backlog/register.html')


def register(request):
    # check if method
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')
        confirmPassword = request.POST.get('confirm_password')
        print(password, confirmPassword)

        # verify that username and password are valid
        accountChecker = AccountChecker(username, password, confirmPassword)
        if accountChecker.validateNewAccount():
            
            # create new account
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()
            
            return redirect('backlog:login')

        # invalid user
        else:
            messages.error(request, 'Invalid account constraints')
            return redirect('backlog:register')

    ## TODO: change to http response redirect
    else: 
        return render(request, 'backlog/register.html')


def projects(request):
    # Came from submitting a new project
    if request.method == "POST":
       
       # get project name input from form 
        newProjectName = request.POST.get("newProjectName")
        
        # TODO: determine how to handle greater than 50 chars, add checking for duplicate names
        if len(newProjectName) > 50 or len(newProjectName) == 0:
            pass # throw an error message or soemthing 
            return redirect('backlog:projects')

        # create object and save to database
        user = User.objects.get(id=request.user.id)
        newProject = Project(projectName=newProjectName, userId=user)
        newProject.save()

        # reload page
        return redirect('backlog:projects')
    
    # coming from login screen
    else:
        
        # query for all projects and pass to template
        projectList = Project.objects.filter(userId=request.user.id)
        projectsTemplate = loader.get_template('backlog/projects.html')
        context = {
            'project_list': projectList
        }
        # TODO: change to return httpresponseredirect 
        return render(request, 'backlog/projects.html', context)


# view a backlog for a project  
def backlog(request, projectId):
    
    # query for columns 
    columnQuery = Column.objects.filter(projectId=projectId)

    # hashtable of column -> [tasks] for each column
    columnTaskHT = {}
    tempStr = ''

    for column in columnQuery:
        
        temp = ''

        # query task and add to hashtable
        taskQuery = Task.objects.filter(columnId=column.columnId)
        columnTaskHT[column.columnId] = taskQuery

        temp += column.columnName + ": "

        # iterate
        for task in taskQuery:
            temp += task.description + ", "

        tempStr += temp + "|"
        
    return HttpResponse(tempStr)
