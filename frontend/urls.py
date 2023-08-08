from django.urls import path
from . import views

#URLConfiguration module
urlpatterns = [
    path('hello/', views.say_hello)
]