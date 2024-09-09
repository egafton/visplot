FROM php:8.1-apache
RUN a2enmod rewrite
RUN a2enmod expires
RUN a2enmod headers
RUN a2enmod remoteip
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf
RUN grep -qxF 'RemoteIPHeader X-Forwarded-For' /etc/apache2/apache2.conf || echo "RemoteIPHeader X-Forwarded-For" >> /etc/apache2/apache2.conf
RUN sed -i 's/ErrorLog /<Directory "\/var\/www\/html">\n\t\tOptions FollowSymLinks\n\t\tAllowOverride All\n\t<\/Directory>\n\n\tErrorLog /' /etc/apache2/sites-enabled/000-default.conf

RUN service apache2 restart

