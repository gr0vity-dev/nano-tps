#!/bin/sh

#Script to create and delete a virtualenv to keep dependencies separate from other projects 
# ./venv_py.sh create 
 # ./venv_py.sh delete

action=$1

if [ "$action" = "reinstall" ];
then
    pip3 install -U --force-reinstall virtualenv
    action=""
fi

if [ "$action" = "" ]; 
then
    pip3 install virtualenv
    python3 -m venv venv_py
    . venv_py/bin/activate

    pip3 install wheel
    pip3 install -r ./config/requirements.txt --quiet

    echo "A new virstaul environment was created. "
elif [ "$action" = "delete" ];
then 
    . venv_py/bin/activate
    deactivate    
    rm -rf venv_py

else
     echo "run ./venv_setup.sh  to create a virtual python environment"
     echo "or"
     echo "run ./venv_setup.sh delete  to delete the virstual python environment"
fi


