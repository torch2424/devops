#!/bin/bash

# From: https://medium.com/@jeremygale/how-to-set-up-a-free-dynamic-hostname-with-ssl-cert-using-google-domains-58929fdfbb7a

### Google Domains provides an API to update a DNS
### "Synthetic record". This script updates a record with 
### the script-runner's public IP address, as resolved using a DNS
### lookup.
###
### Google Dynamic DNS: https://support.google.com/domains/answer/6147083
### Synthetic Records: https://support.google.com/domains/answer/6069273

if [ "$#" -ne 3 ]; then
  echo " "
  echo "googleDynamicDns USAGE:"
  echo "googleDynamicDns [Username] [Password] [Hostname (E.g torch2424.com)]"
  echo " "
  echo "Please take at the link below for more context:"
  echo "https://medium.com/@jeremygale/how-to-set-up-a-free-dynamic-hostname-with-ssl-cert-using-google-domains-58929fdfbb7a"
  echo " "
else
  echo " "
  # Resolve current public IP
  IP=$( dig +short myip.opendns.com @resolver1.opendns.com )
  # Update Google DNS Record
  URL="https://$1:$2@domains.google.com/nic/update?hostname=$3&myip=${IP}"
  curl -s $URL
  echo " "
fi
