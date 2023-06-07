(function() {
    const tutortopBadgeWrapper = document.querySelector('.tutortop-badge-wrapper');
    if (!tutortopBadgeWrapper) {
        console.error('Tutortop Badge not found');
        return;
    }
    
    tutortopBadgeWrapper.href = tutortopBadgeWrapper.href.concat(`?utm_medium=badge&utm_source=${window.location.href}`);
    tutortopBadgeWrapper.style = 'text-decoration: none; display: inline-block';
    tutortopBadgeWrapper.target = '_blank';

    const req = new XMLHttpRequest('');
    req.onload = function () {
        const tutortopBadgeData = JSON.parse(this.responseText).data;
        const tutortopDiv = document.createElement('div');
        tutortopDiv.className = 'tutortop-container';
        var style = document.createElement('style');
        style.innerHTML = 
            `.tutortop-badge {
                font-family: 'Raleway';
                font-style: normal;
                font-weight: 500;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                box-sizing: border-box;
            }
            .tutortop-badge.large {
                width: 323px;
                height: 308px;
                border-radius: 60px 60px 60px 0px;
                padding-top: 20px;
                padding-bottom: 30px;
            }
            .tutortop-badge.medium {
                width: 110.11px;
                height: 105px;
                border-radius: 20.4546px 20.4546px 20.4546px 0px;
                padding-top: 6.82px;
                padding-bottom: 10.68px;
            }
            .tutortop-badge.small {
                width: 47.19px;
                height: 45px;
                border-radius: 8.76623px 8.76623px 8.76623px 0px;
                padding-top: 2.92px;
                padding-bottom: 5.15px;
            }
            .tutortop-badge.large .tutortop-rating svg {
                width: 76px;
                height: 76px;
            }
            .tutortop-badge.medium .tutortop-rating svg {
                width: 26px;
                height: 26px;
            }
            .tutortop-badge.small .tutortop-rating svg {
                width: 11px;
                height: 11px;
            }
            .tutortop-rating {
                text-align: center;
                font-feature-settings: 'pnum' on, 'lnum' on;
            }
            .tutortop-badge.large .tutortop-rating {
                font-size: 93px;
                line-height: 109px;
            }
            .tutortop-badge.medium .tutortop-rating {
                font-size: 32px;
                line-height: 38px;
            }
            .tutortop-badge.small .tutortop-rating {
                font-size: 13px;
                line-height: 15px;
            }
            .tutortop-reviews {
                text-align: center;
                font-feature-settings: 'pnum' on, 'lnum' on;
            }
            .tutortop-badge.large .tutortop-reviews {
                font-size: 35px;
                line-height: 41px;
                margin-bottom: 15px;
            }
            .tutortop-badge.medium .tutortop-reviews {
                font-size: 12px;
                line-height: 14px;
                margin-bottom: 7.5px;
            }
            .tutortop-badge.small .tutortop-reviews {
                font-size: 5px;
                line-height: 6px;
                margin-bottom: 1px;
            }
            .tutortop-name {
                font-weight: 700;
                text-align: center;
            }
            .tutortop-badge.large .tutortop-name {
                font-size: 50px;
                line-height: 59px;
            }
            .tutortop-badge.medium .tutortop-name {
                font-size: 17px;
                line-height: 20px;
            }
            .tutortop-badge.small .tutortop-name {
                font-size: 7px;
                line-height: 8px;
            }`
        document.head.appendChild(style);
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Raleway:wght@500;700&display=swap');
        document.head.appendChild(link);
        reviewsInflection = function (num) {
            const reviews = ['отзыв', 'отзыва', 'отзывов'];
            num %= 100;
            if (num >= 5 && num <= 20) {
                return reviews[2];
            }
            num %= 10;
            if (num == 1) {
                return reviews[0];
            }
            if (num > 1 && num < 5) {
                return reviews[1];
            }
            return reviews[2];
        } 
        tutortopDiv.innerHTML =
        `<div class="tutortop-badge ${tutortopBadgeWrapper.dataset.size}" 
        style="background-color: ${tutortopBadgeWrapper.dataset.backgroundColor};
        color: ${tutortopBadgeWrapper.dataset.fontColor};">
            <div class="tutortop-rating">
                <svg  viewBox="0 0 74 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M37 0.708496L45.5315 26.9659H73.1402L50.8043 43.1938L59.3358 69.4511L37 53.2232L14.6642 69.4511L23.1957 43.1938L0.859852 26.9659H28.4685L37 0.708496Z" fill="${tutortopBadgeWrapper.dataset.fontColor}"/>
                </svg>
                ${tutortopBadgeData.averageRating}
            </div>
            <span class="tutortop-reviews">${tutortopBadgeData.totalPoint} ${reviewsInflection(tutortopBadgeData.totalPoint)}</span>
            <span class="tutortop-name">tutortop</span>
        </div>`;
        tutortopBadgeWrapper.appendChild(tutortopDiv);
    }
    req.onerror = function () {
        console.error('Can not load Tutortop Badge');
    }
    req.open('GET', `https://tutortop.ru/api/badge/${tutortopBadgeWrapper.dataset.school}/`);
    req.send();
})()