# DCSCPP
DCSC Poker Planning

Offers a planning poker application for use within the DCSC. 

## Requirements

Any instance that supports `docker-compose 1.6+`.

An AWS EC2 `t2.micro` should be more than enough for light usage.  

## Installation

On your instance: 
* Install docker-compose 1.6+
* In the DCSCPP directory, run ` docker-compose -f docker-compose.yml up -d `

## Usage

In your browser, navigate to your instance's IP address, port 80. You should be presented with the UI.

Use the left panel to create a session as a SCRUM master, use the right panel to join a session. 
As a SCRUM master, it is your responsability to provide other users with the session ID. 
